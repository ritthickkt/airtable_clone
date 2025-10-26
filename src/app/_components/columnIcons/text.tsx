import '../../../styles/textIcon.css'
import Image from 'next/image';
import Text from '../../assets/text-type.png'

export default function TextIcon() {
  return (
    <div className="text-icon">
      <Image src={Text} width={15} height={15} alt='' style={{ marginRight: '8px'}}/>
    </div>
  );
}