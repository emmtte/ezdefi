import React from 'react'
import { formatEther } from 'viem'
import { Badge } from './ui/badge'

export const Events = ({ events }) => {
  return (
    <div className='mt-10'>
        <h2 className='text-2xl font-bold mb-2'>Events</h2>
        {events.map((event, index) => {
            return (
                <div key={index} className="p-4 mb-3 border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-gray-800">
                    <div className="flex items-center justify-between mb-2">
                        <Badge className={`px-2 py-1 ${
                            event.type === 'Deposit' 
                                ? 'bg-green-500 hover:bg-green-600' 
                                : event.type === 'Withdraw' 
                                    ? 'bg-red-500 hover:bg-red-600' 
                                    : ''
                        }`}>
                            {event.type}
                        </Badge>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(event.blockTimestamp * 1000).toLocaleString()}
                        </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-1 truncate">
                        <span className="font-medium">Adresse:</span> {event.address}
                    </p>
                    <p className="font-bold text-lg text-gray-900 dark:text-white">
                        {formatEther(event.amount)} ETH
                    </p>
                </div>
            )
        })}
    </div>    
  )
}
