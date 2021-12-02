import * as core from '@actions/core'
import * as http from '@actions/http-client'


const runId = process.env.GITHUB_RUN_ID
const runNumber = process.env.GITHUB_RUN_NUMBER
const githubServer = process.env.GITHUB_SERVER_URL
const repo = process.env.GITHUB_REPOSITORY
const buildURL = `${githubServer}/${repo}/actions/runs/${runId}`
const workflow = process.env.GITHUB_WORKFLOW
const actor = process.env.GITHUB_ACTOR
const actorURL = `${githubServer}/${actor}`

const server = core.getInput('server') || 'https://matrix'
const roomID = core.getInput('room-id', {required: true})
const status = core.getInput('status', {required: true})
const user = core.getInput('user')
const password = core.getInput('password')
const customMessage = core.getInput('message')

let accessToken = core.getInput('access_token')

interface MatrixMessage {
  msgtype: string
  body: string
  formatted_body: string
  format: string
}

async function fetchAccessToken(): Promise<void> {
  const client = new http.HttpClient('matrix-message-action')
  const data = {user, password, type: 'm.login.password'}
  const reqURL = `${getBaseURL(server)}/_matrix/client/r0/login`
  const res = await client.post(reqURL, JSON.stringify(data))
  accessToken = JSON.parse(await res.readBody()).access_token
}

async function run(): Promise<void> {
  if (!accessToken && (!user || !password)) {
    const message = '\'password\' or \'access_token\' must be specified'
    core.error(message)
    core.setFailed(message)
    return
  }
  // if we dont have access_token yet we will do a login
  if (!accessToken) {
    await fetchAccessToken()
  }

  await sendMessage()

  // avoid session leak
  if (user && password) {
    await logout()
  }

}

function getBaseURL(server: string): string {
  if (!server.startsWith('http://') && !server.startsWith('https://')) {
    server = `https://${server}`
  }
  const serverURL = new URL(server)
  return `${serverURL.protocol}//${serverURL.host}:${serverURL.port || 443}`
}

async function sendMessage(): Promise<void> {
  const client = new http.HttpClient('matrix-message-action')
  const reqURL = `${getBaseURL(server)}/_matrix/client/r0/rooms/${roomID}/send/m.room.message?access_token=${accessToken}`
  await client.post(reqURL, JSON.stringify(getMatrixMessage()))
  return
}

function getMatrixMessage(): MatrixMessage {
  const message = `${status.toUpperCase()} Build #${runNumber} received status ${status}!`
  let formattedBody = `<h1><span data-mx-color="${getColor()}">${status.toUpperCase()}</span></h1>`
  formattedBody += message ? `<strong>${customMessage}</strong><br>` : ''
  formattedBody += `Build <a href="${buildURL}"> ${repo} #${runNumber} ${workflow}</a> `
  switch (status.toLowerCase()) {
  case 'success':
    formattedBody += 'was successful!'
    break
  case 'failure':
    formattedBody += 'failed!'
    break
  case 'cancelled':
    formattedBody += 'was cancelled!'
    break
  default:
    core.warning(`Unknown build status '${status}'`)
    formattedBody += `has status '${status}'`
  }
  formattedBody += `<br>triggered by <a href="${actorURL}">${actor}</a> `
  return {formatted_body: formattedBody, body: message, format: 'org.matrix.custom.html', msgtype: 'm.text'}
}

async function logout(): Promise<void> {
  const client = new http.HttpClient('matrix-message-action')
  const reqURL = `${getBaseURL(server)}/_matrix/client/r0/logout?access_token=${accessToken}`
  const res = await client.post(reqURL, '')
  if (res.message.statusCode !== 200) {
    core.debug(await res.readBody())
    core.warning('Matrix logout failed!')
  }
}

function getColor() {
  switch (status.toLowerCase()) {
  case 'success':
    return '#00FF2D'
  case 'cancelled':
    return '#FFF608'
  case 'failure':
    return '#FF0A00'
  default:
    core.warning(`'${status}' is no know status switching to default font color'`)
    return '#000000'
  }
}

// noinspection JSIgnoredPromiseFromCall
run()
