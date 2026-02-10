import { Select, MenuItem } from '@mui/material'
import React, { FC } from 'react'

export const SelectBox:FC<any> = () => {
  return (
    <Select>
        <MenuItem value={10}>SSE</MenuItem>
        <MenuItem value={20}>WebSockets</MenuItem>
        <MenuItem value={20}>Push Notification</MenuItem>
        <MenuItem value={10}>Message Broker - AWS SQS</MenuItem>
        <MenuItem value={30}>GraphQL</MenuItem>
        <MenuItem value={30}>gRPC</MenuItem>
        <MenuItem value={10}>Http1.1</MenuItem>
        <MenuItem value={10}>Http2.0</MenuItem>
        <MenuItem value={10}>Http3.0</MenuItem>
        <MenuItem value={10}>Http2+ with Quic Layer</MenuItem>
        <MenuItem value={10}>WebRTC</MenuItem>
        <MenuItem value={10}>Http Streams</MenuItem>
</Select>
  )
}
