
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
    const repoJSONProps = JSON.parse(fs.readFileSync(jsonPath));
    const t = topicFromType(repoJSONProps.integration_type)
    console.log('integration_type:' + repoJSONProps.integration_type)
    console.log('Topic: ' + t)
    getRepoTopics(owner, repo)
      .then((repoTopics) => {
        console.log(repoTopics);
        if (!repoTopics.includes(t)) {
          repoTopics.push(t);
          console.log(repoTopics);
          console.log(`Contents of ghcontext: ${JSON.stringify(ghcontext.context)}`)
          const response = ghcontext.rest.replaceAllTopics({
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

updateTopic(owner, repo, jsonPath)
