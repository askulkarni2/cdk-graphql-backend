/**
 * Tests AppSyncCdkApp
 * 
 * @group e2e
 */
import * as superagent from 'superagent';

const API = process.env.API!;
const API_KEY = process.env.API_KEY!;

describe('List Notes', () => {
  it('List Notes, should be empty', async () => {
    const query = `
      { 
        "query": "query listNotes { listNotes { id name completed } }" 
      }
    `
    const response = await ( superagent
      .post(API)
      .send(query)
      .set('x-api-key', API_KEY)
      .set('Content-Type', 'application/graphql')
      .set('accept', 'json')
    );
    expect(response).toMatchObject({
      status: 200,
      text: "{\"data\":{\"listNotes\":[]}}"
    });
  });
});