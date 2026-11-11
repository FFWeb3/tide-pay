import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'

const ENV_PATH = path.resolve(process.cwd(), '.env')
const PROJECTS = ['app-tide', 'tide-pay']

function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`.env file not found at ${filePath}`)
  }
  const lines = fs.readFileSync(filePath, 'utf8').split('\n')
  const envMap = {}
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim()
    if (key && val) {
      envMap[key] = val
    }
  }
  return envMap
}

function putSecret(projectName, key, secretValue) {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      'npx',
      ['wrangler', 'pages', 'secret', 'put', key, '--project-name', projectName],
      {
        stdio: ['pipe', 'pipe', 'pipe'],
      }
    )

    let stdout = ''
    let stderr = ''

    proc.stdout.on('data', (d) => {
      stdout += d.toString()
    })
    proc.stderr.on('data', (d) => {
      stderr += d.toString()
    })

    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ key, projectName, success: true })
      } else {
        // Redact any possible accidental leaks from error messages
        const sanitizedErr = stderr.replace(new RegExp(secretValue, 'g'), '[REDACTED]')
        reject(new Error(`Failed to upload ${key} to ${projectName} (exit code ${code}): ${sanitizedErr}`))
      }
    })

    proc.stdin.write(secretValue)
    proc.stdin.end()
  })
}

async function main() {
  console.log('Loading secrets from .env...')
  const envMap = parseEnv(ENV_PATH)
  const keys = Object.keys(envMap)

  console.log(`Found ${keys.length} environment keys to securely upload:`)
  for (const k of keys) {
    console.log(`  - ${k}`)
  }

  for (const project of PROJECTS) {
    console.log(`\nUploading secrets to Cloudflare Pages project "${project}"...`)
    for (const key of keys) {
      process.stdout.write(`  * Uploading ${key}... `)
      try {
        await putSecret(project, key, envMap[key])
        console.log('DONE (securely stored in Cloudflare)')
      } catch (err) {
        console.log(`FAILED: ${err.message}`)
        process.exit(1)
      }
    }
  }

  console.log('\nAll secrets successfully pushed to Cloudflare Pages without exposure.')
}

main().catch((err) => {
  console.error('Fatal error during secret upload:', err.message)
  process.exit(1)
})

