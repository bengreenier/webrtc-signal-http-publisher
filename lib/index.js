const Emitter = require('events').EventEmitter
const request = require('request-promise')

module.exports = class Publisher extends Emitter {
  constructor(router) {
    super()
    
    // new peerList implementations will be event emitters
    if (router.peerList.on) {
      router.peerList.on('addPeer:post', () => {
        this.updateSubscribers(router.peerList)
      })

      router.peerList.on('removePeer:post', () => {
        this.updateSubscribers(router.peerList)
      })
    
    // old peerList implementations will not
    } else {
      router.all('*', (req, res, next) => {
        if (req.path.toLowerCase().includes('/sign_in') ||
          req.path.toLowerCase().includes('/sign_out')) {
            this.updateSubscribers(router.peerList)
        }
      })
    }
  }

  /**
   * updates the subscribers with the new state of the world
   * @param {PeerList} peerList
   */
  updateSubscribers(peerList) {
    let totalSessions = 0
    let totalSlots = 0
    let servers = {}

    for (var peer in peerList._peers) {
      const pVal = peerList._peers[peer]
      if (pVal.name.includes('server')) {
        totalSlots += pVal.capacity || 1
        servers[peer] = {
          slots: pVal.capacity || 1
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
      this.emit('update')
    }, (err) => {
      this.emit('update', new Error(`['publisher'] failure ${err}`))
    })
  }
}