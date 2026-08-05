import {
  ConditionalCheckFailedException,
  DynamoDBClient,
  PutItemCommand,
} from '@aws-sdk/client-dynamodb';
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const client = new DynamoDBClient({});
const tableName = process.env.WAITLIST_TABLE_NAME;

function jsonResponse(statusCode: number, body: Record<string, unknown>): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  };
}

function readBody(event: APIGatewayProxyEventV2): unknown {
  if (!event.body) return {};
  const raw = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
  return JSON.parse(raw);
}

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  if (!tableName) {
    console.error('WAITLIST_TABLE_NAME is not configured');
    return jsonResponse(500, { ok: false, error: 'Waitlist signups are not open yet.' });
  }

  let email: unknown;
  try {
    const parsed = readBody(event);
    email = (parsed as { email?: unknown }).email;
  } catch {
    return jsonResponse(400, { ok: false, error: 'Invalid request body.' });
  }

  if (typeof email !== 'string' || !EMAIL_PATTERN.test(email)) {
    return jsonResponse(400, { ok: false, error: 'A valid email address is required.' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    await client.send(
      new PutItemCommand({
        TableName: tableName,
        Item: {
          email: { S: normalizedEmail },
          joinedAt: { S: new Date().toISOString() },
        },
        ConditionExpression: 'attribute_not_exists(email)',
      }),
    );
  } catch (error) {
    if (!(error instanceof ConditionalCheckFailedException)) {
      console.error('Waitlist signup failed', error);
      return jsonResponse(500, { ok: false, error: 'Something went wrong. Please try again.' });
    }
    // Already on the list — treat a repeat submission as success, not an error.
  }

  return jsonResponse(200, { ok: true });
};
