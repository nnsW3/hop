import IncompleteSettlementsWatcher from '#watchers/IncompleteSettlementsWatcher.js'
import { actionHandler, parseNumber, parseString, root } from './shared/index.js'

root
  .command('incomplete-settlements')
  .description('Get incomplete settlements')
  .option('--token <symbol>', 'Token', parseString)
  .option('--days <number>', 'Number of days to search', parseNumber)
  .option('--offset-days <number>', 'Number of days to offset search', parseNumber)
  .option('--format <string>', 'Output format. Options are "table,csv,json"', parseString)
  .action(actionHandler(main))

async function main (source: any) {
  const { token, days, offsetDays, format } = source
  const watcher = new IncompleteSettlementsWatcher({
    token,
    days,
    offsetDays,
    format
  })
  await watcher.start()
  console.log('done')
}
