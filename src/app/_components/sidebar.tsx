import Image from 'next/image';
import search from '../assets/search.svg'

export default function Sidebar() {
  return (
    <div className='left-side-bar'>
      <button className="sidebar-buttons">+ Create New..</button>
      <button className="sidebar-buttons-search"><Image src={search} alt='Search' height={12} width={12}/>Find a view</button>
      <button className="sidebar-buttons">Grid View</button>
    </div>
  )
}