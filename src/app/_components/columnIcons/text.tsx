import '../../../styles/textIcon.css'
import Image from 'next/image';
import Text from '../../assets/text-type.svg'

export default function TextIcon() {
  return (
    <div className="text-icon">
      <Image src={Text} width={15} height={15} alt=''/>
    </div>
  );
}