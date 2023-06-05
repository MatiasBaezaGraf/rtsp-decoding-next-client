import type { NextApiRequest, NextApiResponse } from 'next'

type Data = {
  ip: string
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  let ip = req.headers['x-real-ip'] as string;
  
  const forwardedFor = req.headers['x-forwarded-for'] as string
  if(!ip && forwardedFor){
    ip = forwardedFor?.split(",").at(0) ?? "Unknown";
  }
  
  res.status(200).json({ ip: ip })
}