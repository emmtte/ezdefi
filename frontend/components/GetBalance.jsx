import { formatEther } from 'viem'

const GetBalance = ({ balance, isPending, error }) => {
  return (
    <div>
        {isPending && <div>Loading...</div>}
        {error && <div>Error: {error.shortMessage || error.message}</div>}
        {balance !== undefined && <div>Balance: {formatEther(balance)} ETH</div>}
    </div>
  )
}

export default GetBalance