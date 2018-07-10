const assert = require('assert')
const http = require('http')
const url = require('url')
const request = require('request-promise')
const Publisher = require('../lib/index')

const createMockRouter = (withOn = false) => {
  return {
    peerList: {
        on: withOn ? function (selector, fn) {
        if (this._on[selector]) {
          this._on[selector].push(fn)
        } else {
          this._on[selector] = [fn]
        }
      } : undefined,
      _on: {}
    },
    all: function (selector, fn) {
      if (this._bound[selector]) {
        this._bound[selector].push(fn)
      } else {
        this._bound[selector] = [fn]
      }
    },
    _bound: {}
  }
}

describe('webrtc-signal-http-publisher', () => {
  it('should bind to the router (old version)', () => {
    const router = createMockRouter()

    const instance = new Publisher(router)

    assert.strictEqual(router._bound['*'].length, 1)
    assert.strictEqual(router.peerList._on['addPeer:post'], undefined)
    assert.strictEqual(router.peerList._on['removePeer:post'], undefined)
  })

  it('should bind events (new version)', () => {
    const router = createMockRouter(true)

    const instance = new Publisher(router)

    assert.strictEqual(router._bound['*'], undefined)
    assert.strictEqual(router.peerList._on['addPeer:post'].length, 1)
    assert.strictEqual(router.peerList._on['removePeer:post'].length, 1)
  })

  describe('http', () => {
    let server = null
    let data = null

    before(() => {
      server = http.createServer((req, res) => {
        data = null

        req.on('data', (block) => {
          const b = block.toString()
          if (data == null) {
            data = b
          } else {
            data += b
          }
        })

        req.on('end', () => {
          data = JSON.parse(data)
          res.writeHead(200, { 'Content-Type': 'application/json'})
          res.end(JSON.stringify({status: 'OK'}))
        })
      }).listen()

      const addr = server.address()
      const uri = url.format({
        hostname: '127.0.0.1', // we always use localhost since we'll bind to "any"
        port: addr.port,
        protocol: 'http',
        pathname: '/status'
      })

      process.env.WEBRTC_PUBLISH_URI = uri
    })

    it('should post', (done) => {
      const router = createMockRouter(true)
      const instance = new Publisher(router)

      // trigger all the registered events (shortcut)
      Object.values(router.peerList._on).forEach((fnSet) => {
        fnSet.forEach((fn) => {
          fn()
        })
      })

      // since the above trigger technically fires two updates
      // we use once, to only validate the first one
      instance.once('update', (err) => {
        assert.deepStrictEqual(data, { totalSessions: 0, totalSlots: 0, servers: {} })
        done(err)
      })
    })

    it('should post proper data', (done) => {
      const router = createMockRouter(true)
      const instance = new Publisher(router)

      router.peerList._peers = {
        0: {
          name: 'renderingserver_test',
          capacity: 12
        },
        1: {
          name: 'renderingclient_test'
        }
      }

      // trigger all the registered events (shortcut)
      Object.values(router.peerList._on).forEach((fnSet) => {
        fnSet.forEach((fn) => {
          fn()
        })
      })

      // since the above trigger technically fires two updates
      // we use once, to only validate the first one
      instance.once('update', (err) => {
        assert.deepStrictEqual(data, {
          totalSessions: 1,
          totalSlots: 12,
          servers: {
            0: {
              slots: 12
            }
          }
        })
        done(err)
      })
    })

    after(() => {
      server.close()

      process.env.WEBRTC_PUBLISH_URI = null
    })
  })
})