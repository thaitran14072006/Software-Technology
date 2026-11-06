import {localize} from './core.mjs';
import {REFERENCE_STOPS} from './reference-map.mjs';

// Narration for poster-only stops. Keep these separate from the GPS catalog:
// the drawing supplies positions, not verified geographic coordinates.
const stories = {
  '3': {
    vi: ['Bằng lăng 5 ngọn', 'Bằng lăng 5 ngọn là điểm dừng để ngắm một dáng cây đặc biệt giữa rừng Cát Tiên. Từ gốc cây, hãy đưa mắt theo những nhánh vươn lên cao và thử nhận ra năm ngọn cây đã gợi nên tên gọi này. Những đường nét của thân và cành tạo nên vẻ đẹp riêng, khiến một cây rừng trở thành dấu mốc đáng nhớ trên hành trình. Dừng lại dưới tán lá, bạn có thể quan sát hình dáng cây từ nhiều phía và cảm nhận sự đa dạng của thế giới thực vật quanh mình.'],
    en: ['Five-topped Lagerstroemia', 'This stop invites you to discover an unusual tree in Cat Tien forest. Follow its branches upward and look for the five tops reflected in its name. Viewed from different angles, the trunk and branches form a distinctive silhouette. Pause beneath the canopy to appreciate the variety of shapes found in forest trees.'],
    ja: ['五つ又のサルスベリ', 'カッティエンの森で、特徴ある樹形を楽しめる場所です。根元から枝を目でたどり、名前の由来となった五つの梢を探してみましょう。見る角度によって幹や枝の姿が変わります。木陰で足を止め、森の木々が持つ形の多様さを感じてください。'],
    ko: ['다섯 갈래 배롱나무', '깟띠엔 숲에서 독특한 나무의 모습을 감상하는 지점입니다. 밑동에서 가지를 따라 시선을 올리며 이름에 담긴 다섯 갈래의 꼭대기를 찾아보세요. 바라보는 방향에 따라 줄기와 가지의 모습도 달라집니다. 나무 그늘에서 잠시 쉬며 숲속 나무들의 다양한 형태를 느껴보세요.'],
    zh: ['五冠紫薇树', '在这里，您可以欣赏吉仙森林中形态独特的树木。从树干底部向上观察枝条，寻找名称中提到的五个树冠。从不同角度观看，树干与枝条呈现出不同的轮廓。在树荫下稍作停留，感受森林植物形态的丰富多样。'],
  },
  '4': {
    vi: ['Thiên tuế', 'Điểm Thiên tuế mang đến một góc nhìn khác về thế giới cây rừng. Thay vì chỉ ngước nhìn những tán đại thụ, hãy chú ý đến dáng thân và những tàu lá dài xòe quanh ngọn của cây. Cách sắp xếp của lá tạo nên một hình dáng dễ nhận biết giữa nhiều tầng cây xanh. Đây là dịp để quan sát kỹ những chi tiết nhỏ thường bị bỏ qua khi đi bộ trong rừng, từ đường nét của thân đến sự đối xứng của tán lá.'],
    en: ['Cycad', 'The cycad stop offers a different perspective on forest plants. Look beyond the tall canopy and notice the trunk and long leaves spreading around the crown. Their arrangement gives the plant a recognisable outline among the surrounding greenery. Take time to observe small details, from the texture of the trunk to the symmetry of the leaves.'],
    ja: ['ソテツ', 'この場所では、森の植物を違った視点から観察できます。高木の梢だけでなく、幹や頂部から広がる長い葉にも注目してください。葉の並び方が、周囲の緑の中で特徴ある輪郭を作ります。幹の表情や葉の対称性など、小さな細部をゆっくり眺めてみましょう。'],
    ko: ['소철', '이 지점에서는 숲의 식물을 다른 시선으로 살펴볼 수 있습니다. 높은 나무의 수관뿐 아니라 줄기와 꼭대기에서 사방으로 펼쳐지는 긴 잎에 주목해 보세요. 잎의 배열은 주변 녹음 속에서 독특한 윤곽을 만듭니다. 줄기의 질감과 잎의 대칭 같은 작은 특징을 천천히 관찰해 보세요.'],
    zh: ['苏铁', '这一站让您换个角度观察森林植物。除了仰望高大的树冠，也请留意苏铁的树干以及从顶部向四周伸展的长叶。叶片的排列使它在周围的绿意中呈现出鲜明轮廓。不妨放慢脚步，观察树干纹理与叶片的对称之美。'],
  },
  '6': {
    vi: ['Vườn thực vật', 'Vườn thực vật là điểm dừng để làm quen với sự phong phú của cây cỏ trong hành trình khám phá Cát Tiên. Hãy thử quan sát và so sánh hình dáng lá, màu sắc vỏ cây, cách phân cành và những tầng xanh quanh lối đi. Mỗi đặc điểm nhỏ đều là một gợi ý để nhận biết và tìm hiểu về thực vật. Không gian này giúp chuyến tham quan trở thành một buổi học ngoài trời, nơi bạn có thể đi chậm, đặt câu hỏi và khám phá mối liên hệ giữa cây xanh với môi trường sống của rừng.'],
    en: ['Botanical Garden', 'The botanical garden is a place to get acquainted with plant diversity during your Cat Tien visit. Compare leaf shapes, bark colours and branching patterns along the path. Each detail offers a clue for learning about plants. Treat this stop as an outdoor classroom: slow down, ask questions and explore the relationship between vegetation and the forest environment.'],
    ja: ['植物園', '植物園は、カッティエンの植物の多様さに親しむ場所です。道沿いの葉の形、樹皮の色、枝の伸び方を比べてみましょう。小さな特徴の一つ一つが植物を知る手がかりになります。屋外の教室のようにゆっくり歩き、植物と森の環境とのつながりを考えてみてください。'],
    ko: ['식물원', '식물원은 깟띠엔의 다양한 식물을 알아가는 장소입니다. 길을 따라 잎 모양, 나무껍질 색깔, 가지가 뻗는 모습을 비교해 보세요. 작은 특징 하나하나가 식물을 이해하는 단서가 됩니다. 야외 교실을 걷듯 천천히 둘러보며 식물과 숲의 환경이 맺는 관계를 생각해 보세요.'],
    zh: ['植物园', '植物园是认识吉仙植物多样性的一个停留点。沿着步道，比较叶片形状、树皮颜色以及枝条的生长方式。每个细节都能成为了解植物的线索。把这里当作一间户外课堂，放慢脚步，带着问题探索植物与森林环境之间的联系。'],
  },
  '10': {
    vi: ['Cây 6 múi', 'Cây 6 múi là một điểm nhấn về hình dáng cây trên tuyến tham quan rừng Cát Tiên. Tên gọi gợi sự chú ý đến những đường múi nổi trên thân, tạo nên một dáng cây khác lạ giữa rừng xanh. Hãy quan sát từ nhiều hướng để cảm nhận cách ánh sáng và bóng râm làm nổi bật các đường nét ấy. Điểm dừng này nhắc chúng ta rằng vẻ đẹp của rừng không chỉ nằm ở những tán cây cao, mà còn ở các chi tiết độc đáo của từng thân cây.'],
    en: ['Six-lobed Tree', 'The Six-lobed Tree is a stop for appreciating an unusual trunk shape. Its name draws attention to the raised lobes that distinguish it from surrounding trees. Look from several angles and notice how light and shade reveal its contours. Forest beauty can be found in the details of a single trunk as well as in the canopy above.'],
    ja: ['六稜の木', 'この場所では、特徴ある幹の形に注目してみましょう。名前は幹に浮かぶ稜を連想させます。いろいろな方向から眺めると、光と影によって輪郭の見え方が変わります。森の美しさは高い梢だけでなく、一本の幹の細部にも見つかります。'],
    ko: ['여섯 골 나무', '이 지점에서는 독특한 나무줄기의 형태에 주목해 보세요. 이름은 줄기에 도드라진 골을 떠올리게 합니다. 여러 방향에서 바라보면 빛과 그늘에 따라 윤곽이 다르게 보입니다. 숲의 아름다움은 높은 수관뿐 아니라 나무 한 그루의 세부 모습에서도 찾을 수 있습니다.'],
    zh: ['六棱树', '这一站适合欣赏独特的树干形态。名称让人留意树干上隆起的棱线，使它在周围树木中显得与众不同。从几个方向观察，您会发现光影让轮廓呈现出不同层次。森林之美不仅在高处的树冠，也藏在一棵树的细节之中。'],
  },
  '11': {
    vi: ['Bằng lăng lộc bình', 'Bằng lăng lộc bình gây ấn tượng bởi thân cây có hình dáng khác lạ, gợi liên tưởng đến một chiếc lộc bình giữa rừng. Hãy lùi lại một chút để ngắm toàn bộ dáng cây, rồi quan sát những đường cong và chỗ phình trên thân. Cùng với tán lá phía trên, các chi tiết ấy tạo thành một tác phẩm tự nhiên không lặp lại. Đây là điểm dừng thích hợp để cảm nhận sự đa dạng về hình thái của cây rừng và lưu lại một góc nhìn riêng trong chuyến khám phá Cát Tiên.'],
    en: ['Vase-shaped Lagerstroemia', 'This tree stands out for an unusual trunk that recalls the shape of a decorative vase. Step back to see its outline, then notice the curves and swollen sections of the trunk. Together with the canopy, they form a distinctive natural composition. This stop offers a chance to appreciate the variety of tree forms in Cat Tien.'],
    ja: ['花瓶形のサルスベリ', 'この木は、花瓶を思わせる特徴ある幹が印象的です。少し離れて全体を眺めてから、幹の曲線や膨らみを観察してみましょう。上に広がる葉とともに、自然が作った独特の姿を見せてくれます。カッティエンの木々の多様な形を感じられる場所です。'],
    ko: ['화병 모양 배롱나무', '이 나무는 장식용 화병을 떠올리게 하는 독특한 줄기가 인상적입니다. 조금 떨어져 전체 모습을 본 뒤 줄기의 곡선과 부풀어 오른 부분을 살펴보세요. 위로 펼쳐진 잎과 어우러져 자연이 만든 특별한 형태를 보여줍니다. 깟띠엔 나무들의 다양한 모습을 느낄 수 있는 지점입니다.'],
    zh: ['花瓶形紫薇树', '这棵树以形似花瓶的独特树干给人留下印象。先退后几步欣赏整体轮廓，再观察树干的曲线与膨大部位。它们与上方树冠共同组成一件独特的天然作品。这一站让您感受吉仙森林树木形态的多样之美。'],
  },
  '12': {
    vi: ['Rừng Đại Phong Tử', 'Rừng Đại Phong Tử mở ra một không gian khám phá khác trên hành trình tìm hiểu Cát Tiên. Đại phong tử là một trong những loài cây hiện diện trong hệ sinh thái rừng của vườn, góp phần tạo nên sự phong phú của thảm thực vật nơi đây. Theo bước trên đường mòn, hãy chú ý đến các tầng cây, khoảng sáng dưới tán và âm thanh của rừng. Điểm dừng này là dịp để cảm nhận khu rừng như một hệ thống sống, nơi cây cối, động vật và môi trường luôn gắn bó với nhau.'],
    en: ['Dai Phong Tu Forest', 'Dai Phong Tu Forest offers another setting for exploring Cat Tien. Dai phong tu is among the tree species found in the park and contributes to its plant diversity. Along the trail, notice the layers of vegetation, patches of light beneath the canopy and forest sounds. Experience the forest as a living system connecting plants, animals and their environment.'],
    ja: ['大風子の森', '大風子の森では、カッティエンの森の別の一面に出会えます。大風子は園内に見られる樹木の一つで、植物の多様さを支えています。道を歩きながら、重なる木々や木漏れ日、森の音に注目してください。植物、動物、環境がつながる一つの生きた仕組みとして森を感じてみましょう。'],
    ko: ['대풍자 숲', '대풍자 숲은 깟띠엔의 또 다른 모습을 만나는 장소입니다. 대풍자는 공원에 자라는 나무 중 하나로 식물의 다양성을 이룹니다. 숲길을 걸으며 여러 층의 식물, 나뭇잎 사이로 드는 빛, 숲의 소리에 귀 기울여 보세요. 식물과 동물, 환경이 연결된 살아 있는 하나의 체계로 숲을 느껴보세요.'],
    zh: ['大风子林', '大风子林展现了吉仙森林的另一面。大风子是园内生长的树种之一，丰富了这里的植物多样性。沿步道前行时，请留意层层植被、林冠下的光斑以及森林的声音。您可以在这里感受森林是一个让植物、动物与环境彼此相连的生命系统。'],
  },
};

export function withSchematicNarration(items, lang) {
  const codes = new Set(items.map(p => p.code));
  const lastOrder = Math.max(0, ...items.map(p => Number(p.sortOrder) || 0));
  const extra = REFERENCE_STOPS.filter(([n]) => stories[n] && !codes.has(String(n))).map(([n,x,y,,,type], index) => {
    const translations = Object.entries(stories[n]).map(([langCode,[name,scriptText]]) => ({langCode,name,scriptText,summary:''}));
    return localize({id:`schematic-${n}`,code:String(n),sortOrder:lastOrder+index+1,
      categoryId:type==='facility'?1:2,status:'PUBLISHED',schematic:[x,y],
      lat:null,lng:null,geoVerified:false,geoSourceUrl:null,translations,audios:[]},lang);
  });
  return [...items, ...extra];
}
