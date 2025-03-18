import { ConnectButton } from '@rainbow-me/rainbowkit';

export const Header = () => {
  return (
    <div className='flex justify-between items-center p-5'>
        <div>Logo</div>
        <ConnectButton />
    </div>
  )
}
