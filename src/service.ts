import { Saga, Task } from 'redux-saga'
import { fork } from 'redux-saga/effects'
import { getContext } from './context'

/**
 * Create a service to run.
 */
export function service(job: Saga<[]>) {
  let task: Task
  let stopped = false
  const service = function*() {
    if (!stopped) {
      task = yield fork(job)
    }
  }

  getContext().services.push(service)
  return () => {
    stopped = true
    if (task) {
      task.cancel()
      task = null!
    }
  }
}
