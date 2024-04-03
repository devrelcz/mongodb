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
      required: true
    }),
    projection: Property.Json({
      displayName: 'Projection',
      description: '',
      required: false
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'No matter what the limit is, the maximum number of returned results in the OUTPUT is limited to 10.',
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

      const coll = client.db(context.propsValue.db).collection(context.propsValue.collection);
      const cursor = coll.find(context.propsValue.filter, opts)
      const results = await cursor.toArray();

      // return first ten records from results array to save page load
      if (results.length > 10) {
        return results.slice(0, 10);
      }

      return results
    } catch (error) {
      return error;
    } finally {
      await client.close();
    }
  },
});
