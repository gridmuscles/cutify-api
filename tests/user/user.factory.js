const mockUserData = (data = {}) => {
  const usernameSuffix = Math.round(Math.random() * 10000).toString()
  return {
    name: 'John',
    username: `tester${usernameSuffix}`,
    email: `tester${usernameSuffix}@strapi.com`,
    password: '1234Abc',
    ...data,
  }
}

const createUser = async (data = {}) => {
  const pluginStore = await strapi.store({
    type: 'plugin',
    name: 'users-permissions',
  })

  const settings = await pluginStore.get({
    key: 'advanced',
  })

  const defaultRole = await strapi
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: settings.default_role } })

  return strapi
    .plugin('users-permissions')
    .service('user')
    .add({
      ...mockUserData(data),
      provider: 'local',
      confirmed: true,
      role: defaultRole ? defaultRole.id : null,
    })
}

module.exports = {
  mockUserData,
  createUser,
}
