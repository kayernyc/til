require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;

const { Octokit } = require("@octokit/rest");
const graphqlQueryString = `
query { 
  repository(name: "til", owner: "kayernyc") {
    id
    pushedAt
    pullRequests(first: 5) {
      edges {
        node {
          id
          files(first: 5) {
            nodes {
              path
            }
            totalCount
          }
          mergedAt
        }
      }
    }
  }
}
`;

const headerRegex = /(?<prefix># )(?<title>[a-zA-z ]+)/;

const createDBCollection = async (database, collectionName) => {
  try {
    await database.createCollection(collectionName);
    db = database.collection(collectionName);
    const res = await db.createIndex({'mergedAt': 1, 'titleField': 1}, {unique: true, dropDups: true});
    console.log(`Unique complex key created ${{res}}`);
  } catch (err) {
    console.error(`Error thrown in collection creation: ${err}`); 
  };
}

const fetchAllChanges = async () => { 
  const octokit = new Octokit({
    userAgent: 'kayernyc-til v1.2.3',
    auth: process.env.OCTOKEY
  });
  
  // TODO: add pagination routine if totalCount > 5
  const result =  await octokit.graphql(graphqlQueryString);

  if (result.repository?.pullRequests?.edges) {
    const { edges } = result.repository?.pullRequests;
    const mds = [];
    
    const collectionName = process.env.DB_COLLECTION_NAME;
    
    // open up DB connection
    const client = new MongoClient(process.env.DB_URL);
    await client.connect();
    const database = client.db(process.env.DB_NAME);

    // check if collection existes
    const collectionExists = (await database.listCollections()
      .toArray())
      .some(collectionObj => collectionObj.name === collectionName);
   
    if (collectionExists === false) {
      createDBCollection(database, collectionName);
    }
    
    const collection = database.collection(collectionName);

    edges.forEach(({node: {files: {nodes}, mergedAt}}) => {
      nodes.forEach(({path}) => {
        const end = path.slice(-3);
        if (end === '.md') {
          mds.push({path, mergedAt});
        }
      })
    });

    const records = await Promise.allSettled(
      mds.map(async ({path: markdownpath, mergedAt}) => {
        path = `https://github.com/kayernyc/til/raw/main/${markdownpath}`;

        return await fetch(path)
          .then(async (response) => {
            const txt = await response.text();
            const titleField = headerRegex.exec(txt).groups?.title;
            return ({titleField, path: markdownpath, mergedAt: new Date(mergedAt).getTime()});
          });
      })
    ).then((results) => {
      return results.map(result => result.value);
    });

    try {
      const insertManyResults = await collection.insertMany(records, {ordered: false})
      console.log(`${insertManyResults.insertedCount} document${insertManyResults.insertedCount > 1 ? 's': ''} successfully inserted.`);
    } catch (err) {
      if (err instanceof Error) {
        console.error('ERROR', err.message);
      } else {
        console.warn(`Unknow error received: ${err}`);
      }
    } finally {
      await client.close();
    }
  }
}

fetchAllChanges()
