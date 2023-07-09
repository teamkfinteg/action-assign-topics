
// TODO: move readJSON to exportable module


const fs = require('fs');
const core = require('@actions/core');
const { Octokit } = require('@octokit/rest');
const github = new Octokit({ auth: process.env.GITHUB_TOKEN });
const { owner: orgName, repo:repoName } = github.rest.repos;
const jsonPath = 'integration-manifest.json';


async function readJSON(owner, repo, path) {
  try {
    const fileContents = await github.request('GET /repos/{owner}/{repo}/contents/{path}', {
      owner: owner,
      repo: repo,
      path: path
    })
    let fc = fileContents.data.content;
    let buff = new Buffer.from(fc, 'base64');
    let text = buff.toString('ascii');
    repoJSONProps = JSON.parse(text);
  }
  catch (err) {
    console.log(path + ' not found.')
  }
}

async function getRepoTopics(owner, repo) {
  const response = await github.request("GET /repos/{owner}/{repo}/topics", {
    owner,
    repo
  });
  const repoTopics = response.data.names;
  return repoTopics;
}

function topicFromType(type) {
  switch (type) {
    case 'orchestrator':
      topic = 'keyfactor-universal-orchestrator'
      break;
    case 'windows-orchestrator':
      topic = 'keyfactor-orchestrator'
      break;
    case 'ca-gateway':
      topic = 'keyfactor-cagateway'
      break;
    case 'pam':
      topic = 'keyfactor-pam'
      break;
    case 'api-client':
      topic = 'keyfactor-api-client'
      break;
    default:
      console.log(`Unknwon type: ` + repoJSONProps.integration_type);
  }
  return topic;
}
async function updateTopic(owner, repo, path) {
  try {
    await readJSON(owner, repo, path);
    console.log(repoName);
    const t = topicFromType(repoJSONProps.integration_type)
    console.log('integration_type:' + repoJSONProps.integration_type)
    console.log('Topic: ' + t)
    getRepoTopics(orgName, repoName)
      .then((repoTopics) => {
        console.log(repoTopics);
        if (!repoTopics.includes(t)) {
          repoTopics.push(t);
          console.log(repoTopics);
          const response = github.request("PUT /repos/{owner}/{repo}/topics", {
            owner,
            repo,
            names: repoTopics
          });
        }
        core.setOutput('dbg-out', repoTopics);
      })
      .catch((err) => console.error(err));
  }
  catch (err) {
    console.log(repo + ' not found.')
  }
}

updateTopic(orgName, repoName, jsonPath)
