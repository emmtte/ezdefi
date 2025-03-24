import { ConnectButton } from '@rainbow-me/rainbowkit';

const Header = () => {
  return (
    <div className='flex justify-between items-center p-5'>
        <div>EZ defi</div>
        <ConnectButton />
    </div>
  )
}

export default Header