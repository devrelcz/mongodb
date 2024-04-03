
    import { createPiece, PieceAuth, Property } from "@activepieces/pieces-framework";
    import { find } from './lib/actions/find';
    import { MongoClient } from 'mongodb';

    export const mongoDbAuth = PieceAuth.CustomAuth({
      props: {
        connectionString: Property.ShortText({
          displayName: 'Connection String',
          required: true,
          description:
            'Connection string to MongoDb.',
        })
      },
      required: true,
      validate: async ({auth}) => {
        try {
          const client = new MongoClient(auth.connectionString);
          await client.connect();
          await client.close()

          return {
            valid: true
          }
        } catch (error) {
          return {
            valid: false,
            error: 'error connecting to db'
          }
        }
      }
    });

    export const mongodb = createPiece({
      displayName: "MongoDB",
      auth: mongoDbAuth,
      minimumSupportedRelease: '0.20.0',
      logoUrl: "https://cdn.iconscout.com/icon/premium/png-512-thumb/mongodb-5363123-4488912.png",
      authors: ["Daniel Rataj <info@devrel.cz>"],
      actions: [
        find
      ],
      triggers: [],
    });
