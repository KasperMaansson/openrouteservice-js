import request from 'superagent'
import Promise from 'bluebird'
import OrsUtil from './OrsUtil'

const orsUtil = new OrsUtil()

class OrsIsochrones {
  constructor(args) {
    this.meta = null
    this.args = {}
    if ('api_key' in args) {
      this.args.api_key = args.api_key
    } else {
      // eslint-disable-next-line no-console
      console.log('Please add your openrouteservice api_key..')
    }
  }

  addLocation(latlon) {
    if (!('locations' in this.args)) {
      this.args.locations = []
    }
    this.args.locations.push(latlon)
  }

  getBody(args) {
    let options = {}

    if (args.restrictions) {
      options.profile_params = {
        restrictions: { ...args.restrictions }
      }
      delete args.restrictions
    }
    if (args.avoidables) {
      options.avoid_features = [...args.avoidables]
      delete args.avoidables
    }

    if (args.avoid_polygons) {
      options.avoid_polygons = { ...args.avoid_polygons }
      delete args.avoid_polygons
    }

    if (Object.keys(options).length > 0) {
      return { ...args, options: options }
    } else {
      return { ...args }
    }
  }

  calculate(reqArgs) {
    if (!reqArgs.service) {
      reqArgs.service = 'isochrones'
    }
    if (!reqArgs.host) {
      reqArgs.host = 'https://api.openrouteservice.org'
    }
    if (!reqArgs.api_version) {
      reqArgs.api_version = 'v2'
    }

    orsUtil.copyProperties(reqArgs, this.args)
    const that = this

    return new Promise(function(resolve, reject) {
      const timeout = 10000
      if (that.args.api_version === 'v2') {
        // meta should be generated once that subsequent requests work
        if (that.meta == null) {
          that.meta = orsUtil.prepareMeta(that.args)
        }
        that.httpArgs = orsUtil.prepareRequest(that.args)
        let url = orsUtil.prepareUrl(that.meta)

        const postBody = that.getBody(that.httpArgs)

        request
          .post(url)
          .send(postBody)
          .set('Authorization', that.meta.apiKey)
          // .set('Content-Type', that.meta.mimeType)
          // .accept('application/geo+json')
          .timeout(timeout)
          .end(function(err, res) {
            if (err || !res.ok) {
              // eslint-disable-next-line no-console
              console.error(err)
              reject(err)
            } else if (res) {
              resolve(res.body)
            }
          })
      } else {
        // eslint-disable-next-line no-console
        console.error('Please use ORS API v2')
      }
    })
  }
}

export default OrsIsochrones
