require('dotenv').config();

const { Octokit } = require("@octokit/rest");
const headerRegex = /(?<prefix># )(?<title>[a-zA-z ]+)/;

const fetchAllChanges = async () => { 
  const octokit = new Octokit({
    userAgent: 'kayernyc-til v1.2.3',
    auth: process.env.OCTOKEY
  });
  
  const result =  await octokit.graphql(`
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
  `);

  // TODO: add pagination routine if totalCount > 5

  if (result.repository?.pullRequests?.edges) {
    const { edges } = result.repository?.pullRequests;
    const mds = [];

    edges.forEach(({node: {files: {nodes}, mergedAt}}) => {
      nodes.forEach(({path}) => {
        const end = path.slice(-3);
        if (end === '.md') {
          mds.push({path, mergedAt});
        }
      })
    });

    mds.forEach(async ({path: markdownpath, mergedAt}) => {
      path = `https://github.com/kayernyc/til/raw/main/${markdownpath}`
      const stream = await fetch(path).then(async (response) => {
        
        const txt = await response.text();
        const header = headerRegex.exec(txt).groups?.title;
        
        // Confirm that record doesn't already exist in DB
        // Add to DB

        console.log(txt, {header}, mergedAt);
      });
    })
  }
  
}

fetchAllChanges();