const request = require('request-promise')

module.exports = (router) => {
  // new peerList implementations will be event emitters
  if (router.peerList.on) {
    router.peerList.on('addPeer:post', () => {
      updateSubscribers(router.peerList)
    })

    router.peerList.on('removePeer:post', () => {
      updateSubscribers(router.peerList)
    })
  
  // old peerList implementations will not
  } else {
    router.all('*', (req, res, next) => {
      if (req.path.toLowerCase().includes('/sign_in') ||
        req.path.toLowerCase().includes('/sign_out')) {
          updateSubscribers(router.peerList)
      }
    })
  }
}

/**
 * updates the subscribers with the new state of the world
 * @param {PeerList} peerList
 */
const updateSubscribers = (peerList) => {
  const totalSessions = 0
  const totalSlots = 0
  const servers = {}

  for (var peer in peerList._peers) {
    if (peer.name.includes('server')) {
      totalSlots += peer.capacity || 1
      servers[peer.id] = {
        slots: peer.capacity || 1
      }
    } else {
      totalSessions++
    }
  }

  request(process.env.WEBRTC_PUBLISH_URI, {
    method: 'POST',
    json: true,
    body: {
      totalSessions,
      totalSlots,
      servers
    }
  }).then(() => {
    console.log(`['publisher'] success`)
  }, (err) => {
    console.log(`['publisher'] failure ${err}`)
  })
}