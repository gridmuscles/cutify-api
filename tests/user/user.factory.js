const mockUserData = (data = {}) => {
  const usernameSuffix = Math.round(Math.random() * 10000).toString()
  return {
    name: 'John',
    username: `tester${usernameSuffix}`,
    email: `tester${usernameSuffix}@strapi.com`,
    password: '1234Abc',
    phone: `+99${usernameSuffix}`,
    ...data,
  }
}

const createUser = async (data = {}) => {
  if (!data.type || data.type === 'public') {
    return [null, null]
  }

  const role = await strapi.query('plugin::users-permissions.role').findOne({
    where: { type: data?.type ?? 'authenticated' },
  })

  const user = await strapi
    .plugin('users-permissions')
    .service('user')
    .add({
      ...mockUserData(data),
      role: role?.id ?? null,
      provider: 'local',
      confirmed: true,
    })

  const jwt = await strapi.plugins['users-permissions'].services.jwt.issue({
    id: user.id,
  })

  return [user, jwt]
}

module.exports = {
  mockUserData,
  createUser,
}
