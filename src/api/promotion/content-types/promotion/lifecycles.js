const getUpdatedLocationConnection = async ({ organizations, locations }) => {
  const orgLocations = await strapi.db
    .query('api::location.location')
    .findMany({
      where: {
        organization: {
          id: {
            $in: organizations.map(({ id }) => id),
          },
        },
      },
    })

  return [...orgLocations.map(({ id }) => ({ id })), ...locations]
}

module.exports = {
  beforeCreate: async ({ params }) => {
    if (params.data.organization?.connect?.length > 0) {
      params.data.locations.connect = await getUpdatedLocationConnection({
        organizations: params.data.organization.connect,
        locations: params.data.locations.connect,
      })
    }
  },

  beforeUpdate: async ({ params }) => {
    if (params.data.organization?.disconnect?.length > 0) {
      params.data.locations.disconnect = await getUpdatedLocationConnection({
        organizations: params.data.organization.disconnect,
        locations: params.data.locations.disconnect,
      })
    }

    if (params.data.organization?.connect?.length > 0) {
      params.data.locations.connect = await getUpdatedLocationConnection({
        organizations: params.data.organization.connect,
        locations: params.data.locations.connect,
      })
    }
  },
}
