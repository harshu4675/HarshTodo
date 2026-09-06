export function createSettingsActions({ getRepos, getState, dispatch, reportError }) {
  async function updateSettings(patch) {
    try {
      const next = await getRepos().settings.save({ ...getState().settings, ...patch })
      dispatch({ type: 'settings/set', settings: next })
      return next
    } catch (error) {
      reportError(error, 'update settings')
      throw error
    }
  }
  async function getMeta(key) {
    return getRepos().settings.getMeta(key)
  }
  async function setMeta(key, value) {
    return getRepos().settings.setMeta(key, value)
  }
  return { updateSettings, getMeta, setMeta }
}
