import { createAction, Property } from '@activepieces/pieces-framework';
import { mongoDbAuth } from '../..';
import { MongoClient } from 'mongodb';

export const find = createAction({
  auth: mongoDbAuth,
  name: 'find',
  displayName: 'Find',
  description: 'Find documents in a collection.',
  props: {
    db: Property.ShortText({
      displayName: 'Database',
      description: 'Database.',
      required: true,
    }),
    collection: Property.ShortText({
      displayName: 'Collection',
      description: 'Collection.',
      required: true,
    }),
    filter: Property.Json({
      displayName: 'Filter',
      description: '',
      required: false
    }),
    projection: Property.Json({
      displayName: 'Projection',
      description: '',
      required: false
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'No matter what the limit is, the maximum number of returned results in the OUTPUT in Activepieces is limited to 10.',
      required: false,
      defaultValue: 0
    }),
  },
  async run(context) { // eslint-disable-line
    const {
      connectionString,
    } = context.auth;

    const client = new MongoClient(connectionString, {
      connectTimeoutMS: 3000,
    });

    try {
      await client.connect()

      const opts = {
        projection: {},
        limit: 0
      }

      if (context.propsValue.projection) {
        opts.projection = context.propsValue.projection;
      }

      if (context.propsValue.limit) {
        opts.limit = context.propsValue.limit || 0;
      }

      // filter example
      // {
      //   "$or": [
      //     {
      //       "type": "estates-to-buy--new"
      //     }
      //   ],
      //   "createdAt": {
      //     "$gte": "ISODate('2024-04-03T00:00:00.000Z')"
      //   }
      // }
      let filter = context.propsValue.filter as object
      let updatedFilter

      if (filter) {
        // deep recursive function to convert string ISODate with the content to Date object, key is the same
        const convertISODate = (obj: { [x: string]: string | object }) => {
          for (const key in obj) {
            if (typeof obj[key] === 'object') {
              convertISODate(obj[key] as { [x: string]: string | object });
            } else {
              if (typeof obj[key] === 'string' && (obj[key] as string).includes('ISODate')) {
                obj[key] = new Date((obj[key] as string).replace(/ISODate\(|\)|'/g, ''));
              }
            }
          }
        };

        updatedFilter = convertISODate(filter as { [x: string]: string | object });
      }

      if (updatedFilter !== undefined) {
        filter = updatedFilter;
      }

      const coll = client.db(context.propsValue.db).collection(context.propsValue.collection);
      const cursor = coll.find(filter, opts)
      const results = await cursor.toArray();

      // return first ten records from results array to save page load
      if (results.length > 10) {
        return results.slice(0, 10);
      }

      return results || []
    } catch (error) {
      return error;
    } finally {
      await client.close();
    }
  },
});
