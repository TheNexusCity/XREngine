import { Paginated, Params } from '@feathersjs/feathers'
import { Service, SequelizeServiceOptions } from 'feathers-sequelize'
import { Application } from '../../../declarations'

/**
 * A class for Static Resource  service
 *
 * @author Vyacheslav Solovjov
 */
export class StaticResource extends Service {
  app: Application
  public docs: any

  constructor(options: Partial<SequelizeServiceOptions>, app: Application) {
    super(options)
  }

  async create(data, params?: Params): Promise<any> {
    const oldResource = await this.find({
      query: {
        $select: ['id'],
        url: data.url
      }
    })

    if ((oldResource as any).total > 0) {
      return this.Model.update(data, {
        where: { url: data.url }
      })
    } else {
      return this.Model.create(data)
    }
  }

  async find(params?: Params): Promise<any> {
    if (params?.query?.getAvatarThumbnails === true) {
      delete params.query.getAvatarThumbnails
      const result = await super.Model.findAndCountAll({
        limit: params.query.$limit,
        skip: params.query.$skip,
        select: params.query.$select,
        where: {
          staticResourceType: params.query?.staticResourceType,
          userId: params.query?.userId
        },
        raw: true,
        nest: true
      })
      for (const item of result.rows) {
        item.thumbnail = await super.Model.findOne({
          where: {
            name: item.name,
            staticResourceType: 'user-thumbnail'
          }
        })
      }
      return {
        data: result.rows,
        total: result.total
      }
    } else return super.find(params)
  }
}
