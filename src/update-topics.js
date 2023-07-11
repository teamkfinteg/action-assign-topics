
// TODO: move readJSON to exportable module


const fs = require('fs');
const core = require('@actions/core');
const ghcontext = require('@actions/github');
const { Octokit } = require('@octokit/rest');

const jsonPath = core.getInput('input-file');
const token = core.getInput('repo-token');

const github = new Octokit({ auth: token });
const { owner, repo } = ghcontext.context.repo;
console.log(`owner: ${owner}, repo: ${repo}`)


async function getRepoTopics(owner, repo) {
  const response = await github.request("GET /repos/{owner}/{repo}/topics", {
    owner,
    repo
  });
  const repoTopics = response.data.names;
  return repoTopics;
}
async function updateRepoTopics(owner, repo, names) {
  console.log(`Replacing topic.names with ${names}`);
  try {
    const response = await github.request("PUT /repos/{owner}/{repo}/topics", {
      owner,
      repo,
      names
    });
    
    const repoTopics = response.data.names;
    return repoTopics;

  } catch (e) {
    console.log(e.message)
  }
  console.log(`response = ${response}`)
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
async function checkAndUpdateTopic(owner, repo, path) {
  try {
    const repoJSONProps = JSON.parse(fs.readFileSync(jsonPath));
    const t = topicFromType(repoJSONProps.integration_type)
    console.log('integration_type:' + repoJSONProps.integration_type)
    console.log('Topic: ' + t)
    var repoTopics = await getRepoTopics(owner, repo)
    console.log(repoTopics);
    if (!repoTopics.includes(t)) {
      repoTopics.push(t);
      await updateRepoTopics(owner, repo, '["my-own-test"]')
    }
  } catch (e) {
    console.log(e.message)
    }
  }


checkAndUpdateTopic(owner, repo, jsonPath)
