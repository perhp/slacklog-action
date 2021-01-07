const github = require('@actions/github')
const core = require('@actions/core')
const { WebClient } = require('@slack/web-api')

const slackClientToken = core.getInput('SLACK_CLIENT_TOKEN')
const slackChannel = core.getInput('SLACK_CHANNEL_ID')
const actionStatus: 'successs' | 'failure' | 'cancelled' = core.getInput('ACTION_STATUS')
const actionWorkflowName = core.getInput('ACTION_WORKFLOW_NAME')

const context = github.context

const EVENTS = {
  PUSH: 'push',
  PULL_REQUEST: 'pull_request'
}

interface Commit {
  author: {
    email: string,
    name: string
  },
  committer: {
    email: string,
    name: string
  },
  distinct: boolean,
  id: string,
  message: string,
  timestamp: string,
  tree_id: string,
  url: string
}

async function run() {
  let message = ''
  const slack = new WebClient(slackClientToken)

  switch(context.eventName) {
    case EVENTS.PUSH:
      if (github.context?.payload?.commits?.length) {

        let statusEmoji = ':white_check_mark:';

        switch (actionStatus) {
          case 'failure':
            statusEmoji = ':rotating_light:';
            break;
          case 'cancelled':
            statusEmoji = ':no_entry:';
            break;
        }
        
        message += `${statusEmoji} ${actionWorkflowName} \n `

        context.payload.commits.forEach((commit: Commit) => {
          const [title, ...description] = commit.message.split('\n')
          message += `[<${commit.url}|${commit.id.substring(0, 7)}>] *${title}* ${description ? description.join('\n') : '\n'} - (${commit.author.name})\n`
        })

        slack.chat.postMessage({
          text: message,
          channel: slackChannel
        })
      }
  }
}

run()