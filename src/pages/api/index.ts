import type { NextApiRequest, NextApiResponse } from 'next';

type Data = {
  error: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {
  res.status(200).json({ error: 'Try the route [...]/api/v1/...' });
}
