/* Lesson content that mirrors the Human Anatomy for Kids app. */
(function (HA) {
  'use strict';
  var C = HA.CONTENT = {};

  // "Meet your body": spots on the child picture (0..1 of width and height)
  C.bodyParts = [
    { name: 'Head', fact: 'Your head holds your brain and your face.', target: [0.52, 0.145], tag: [0.885, 0.05] },
    { name: 'Hair', fact: 'Your hair grows from your head and helps keep it warm.', target: [0.40, 0.075], tag: [0.115, 0.06], also: [[0.60, 0.08]] },
    { name: 'Eyes', fact: 'Your eyes help you see.', target: [0.54, 0.18], tag: [0.885, 0.12], also: [[0.44, 0.187]] },
    { name: 'Nose', fact: 'Your nose helps you smell and breathe.', target: [0.50, 0.208], tag: [0.885, 0.19] },
    { name: 'Mouth', fact: 'Your mouth helps you eat and speak.', target: [0.50, 0.233], tag: [0.885, 0.26] },
    { name: 'Ears', fact: 'Your ears help you hear.', target: [0.378, 0.205], tag: [0.115, 0.17], also: [[0.605, 0.192]] },
    { name: 'Neck', fact: 'Your neck connects your head and body.', target: [0.455, 0.288], tag: [0.115, 0.29], also: [[0.55, 0.288]] },
    { name: 'Chest', fact: 'Your heart and lungs are inside your chest.', target: [0.56, 0.37], tag: [0.885, 0.36] },
    { name: 'Tummy', fact: 'Many organs that digest food are inside your tummy.', target: [0.51, 0.48], tag: [0.885, 0.47] },
    { name: 'Arms', fact: 'Your arms help you reach and lift.', target: [0.315, 0.445], tag: [0.115, 0.385], also: [[0.685, 0.447]] },
    { name: 'Hands', fact: 'Your hands help you touch and hold things.', target: [0.215, 0.565], tag: [0.115, 0.465], also: [[0.775, 0.565]] },
    { name: 'Legs', fact: 'Your legs help you stand, walk and run.', target: [0.605, 0.74], tag: [0.885, 0.72], also: [[0.40, 0.76]] },
    { name: 'Knees', fact: 'Your knees bend so you can sit, kneel and jump.', target: [0.405, 0.70], tag: [0.115, 0.68], also: [[0.60, 0.70]] },
    { name: 'Feet', fact: 'Your feet help you balance and walk.', target: [0.345, 0.875], tag: [0.115, 0.875], also: [[0.635, 0.88]] }
  ];

  // Body playroom
  C.playParts = [
    { name: 'Eye', picture: '👁️', paired: true, partner: '👀 Helps you see', lesson: 'Your eyes help you see the world around you.' },
    { name: 'Ear', picture: '👂', paired: true, partner: '👂 Helps you hear', lesson: 'Your ears help you hear sounds, like music and voices.' },
    { name: 'Nose', picture: '👃', paired: false, partner: '👃 Helps you smell', lesson: 'Your nose helps you smell and breathe.' },
    { name: 'Hand', picture: '✋', paired: true, partner: '✋ Helps you hold', lesson: 'Your hands help you touch and hold things.' },
    { name: 'Foot', picture: '🦶', paired: true, partner: '🦶 Helps you walk', lesson: 'Your feet help you balance and walk.' },
    { name: 'Brain', picture: '🧠', paired: false, partner: '🧠 Helps you think', lesson: 'Your brain helps you think, learn and move.' },
    { name: 'Tongue', picture: '👅', paired: false, partner: '👅 Helps you taste', lesson: 'Your tongue helps you taste food and talk.' },
    { name: 'Mouth', picture: '👄', paired: false, partner: '👄 Helps you eat', lesson: 'Your mouth helps you eat and speak.' },
    { name: 'Heart', picture: '🫀', paired: false, partner: '🫀 Pumps blood', lesson: 'Your heart pumps blood all around your body.' },
    { name: 'Lungs', picture: '🫁', paired: true, partner: '🫁 Fill with air', lesson: 'Your lungs fill with air each time you breathe in.' },
    { name: 'Arm', picture: '💪', paired: true, partner: '💪 Helps you lift', lesson: 'Your arms help you reach, lift and throw.' },
    { name: 'Leg', picture: '🦵', paired: true, partner: '🦵 Helps you run', lesson: 'Your legs help you stand, walk and run.' },
    { name: 'Kidneys', picture: '🫘', paired: true, partner: '🩸 Cleans your blood', lesson: 'Your kidneys clean your blood.' },
    { name: 'Teeth', picture: '🦷', paired: false, partner: '🍎 Help you chew', lesson: 'Your teeth help you chew your food.', sortable: false },
    { name: 'Bone', picture: '🦴', paired: false, partner: '🥛 Hold you up', lesson: 'Bones hold your body up and protect your organs.', sortable: false }
  ];
  C.games = [
    { title: 'Match the pair', hint: 'Pair each part with its partner', emoji: '🔗', from: '#FF85B3', to: '#ED4585' },
    { title: 'One or a pair?', hint: 'Do we have one, or two?', emoji: '👀', from: '#C28FFF', to: '#8552F2' },
    { title: 'Find body parts', hint: 'Spot the hidden pictures', emoji: '🔍', from: '#8CEB8C', to: '#33B366' },
    { title: 'Spell the word', hint: 'Build the word, letter by letter', emoji: '🔤', from: '#80D9FF', to: '#3385F2' },
    { title: 'Picture puzzle', hint: 'Swap the pieces into place', emoji: '🧩', from: '#FFDB66', to: '#FF9933' },
    { title: 'What is it?', hint: 'Guess the body part', emoji: '🤔', from: '#73E6E0', to: '#1FA8B3' }
  ];

  // "Label my body"
  C.labelSpots = [
    { name: 'Hair', point: [0.49, 0.06], hint: 'on top of the head' },
    { name: 'Ear', point: [0.60, 0.19], hint: 'on the side of the head' },
    { name: 'Nose', point: [0.49, 0.205], hint: 'in the middle of the face' },
    { name: 'Neck', point: [0.49, 0.285], hint: 'between the head and the body' },
    { name: 'Chest', point: [0.50, 0.40], hint: 'on the upper body' },
    { name: 'Tummy', point: [0.50, 0.50], hint: 'in the middle of the body' },
    { name: 'Arm', point: [0.30, 0.47], hint: 'on the side of the body' },
    { name: 'Hand', point: [0.235, 0.565], hint: 'at the end of the arm' },
    { name: 'Knee', point: [0.40, 0.725], hint: 'in the middle of the leg' },
    { name: 'Foot', point: [0.357, 0.878], hint: 'at the bottom of the leg' }
  ];

  // Magic Lens
  C.lensLayers = [
    { id: 'organs', title: 'Organs', icon: '❤️', image: 'LensOrgans', tint: '#FF4D8D' },
    { id: 'bones', title: 'Bones', icon: '🦴', image: 'LensBones', tint: '#FF9500' },
    { id: 'blood', title: 'Blood', icon: '🩸', image: 'LensVessels', tint: '#FF3B30' }
  ];
  C.lensTags = {
    organs: [['Brain', 0.495, 0.114], ['Windpipe', 0.495, 0.307], ['Lungs', 0.60, 0.355], ['Heart', 0.52, 0.377], ['Liver', 0.45, 0.43],
      ['Stomach', 0.55, 0.44], ['Large intestine', 0.40, 0.52], ['Small intestine', 0.50, 0.54], ['Bladder', 0.498, 0.583]],
    bones: [['Skull', 0.493, 0.13], ['Collarbone', 0.58, 0.323], ['Ribs', 0.43, 0.39], ['Spine', 0.496, 0.45], ['Hip bones', 0.44, 0.581]],
    blood: [['Neck vessels', 0.497, 0.276], ['Near the heart', 0.496, 0.395], ['Arm vessels', 0.25, 0.471], ['Arm vessels', 0.74, 0.468],
      ['Tummy vessels', 0.493, 0.522], ['Hand', 0.174, 0.563], ['Leg vessels', 0.411, 0.80], ['Leg vessels', 0.577, 0.80]]
  };
  C.lensRegion = function (layer, x, y) {
    var isArm = (x < 0.30 || x > 0.70) && y > 0.28 && y < 0.62;
    var area = y < 0.27 ? 'head' : isArm ? 'arm' : y < 0.45 ? 'chest' : y < 0.66 ? 'belly' : 'leg';
    var T = {
      'organs.head': ['Brain', 'Your brain is the boss of your body. It helps you think, learn and move.'],
      'organs.chest': ['Heart and lungs', 'Your heart pumps blood. Your lungs fill with air each time you breathe in.'],
      'organs.belly': ['Tummy organs', 'Your stomach, liver and intestines work together to turn food into energy.'],
      'organs.other': ['Arms and legs', 'Under your skin are muscles, bones and blood vessels. Try the Blood and Bones lenses!'],
      'bones.head': ['Skull', 'Your skull is a strong helmet that protects your brain.'],
      'bones.chest': ['Rib cage', 'Your ribs curve around your heart and lungs like a safe cage.'],
      'bones.belly': ['Spine and hips', 'Your spine holds you up and guards your spinal cord. Your hips help you walk.'],
      'bones.other': ['Arm and leg bones', 'Arms and legs have long bones too. This picture shows the skull, spine, ribs and hips.'],
      'blood.head': ['Blood to the brain', 'Blood vessels bring oxygen to your brain so it can keep thinking.'],
      'blood.chest': ['Blood highways', 'The biggest blood vessels leave your heart here and spread all over your body.'],
      'blood.belly': ['Blood on the move', 'Blood vessels carry nutrients from your food to every part of you.'],
      'blood.arm': ['Blood in your arms', 'Blood travels all the way to your fingertips and back to your heart.'],
      'blood.leg': ['Blood in your legs', 'Blood flows down to your toes, then climbs back up to your heart.']
    };
    return T[layer + '.' + area] || (layer === 'blood' ? T['blood.leg'] : T[layer + '.other']);
  };

  // Food Journey
  C.foods = [
    { id: 'apple', emoji: '🍎', name: 'Apple', healthy: true }, { id: 'carrot', emoji: '🥕', name: 'Carrot', healthy: true },
    { id: 'broccoli', emoji: '🥦', name: 'Broccoli', healthy: true }, { id: 'bread', emoji: '🍞', name: 'Bread', healthy: true },
    { id: 'milk', emoji: '🥛', name: 'Milk', healthy: true }, { id: 'cookie', emoji: '🍪', name: 'Cookie', healthy: false }
  ];
  C.foodSteps = [
    { x: 0.495, y: 0.337, text: 'Yum! Your teeth chew and your saliva starts breaking the food down.', scale: 1.0, move: 0.6, hold: 2.6 },
    { x: 0.498, y: 0.400, text: 'Gulp! You swallow.', scale: 0.9, move: 0.8, hold: 0.6 },
    { x: 0.506, y: 0.530, text: 'Your esophagus squeezes in waves to push the food down.', scale: 0.85, move: 1.6, hold: 1.4 },
    { x: 0.532, y: 0.673, text: 'In your stomach the food is mixed into a soupy mush.', scale: 0.7, move: 1.2, hold: 2.6 },
    { x: 0.550, y: 0.715, scale: 0.55, move: 0.7, hold: 0 },
    { x: 0.460, y: 0.735, text: 'The small intestine takes the good nutrients into your blood.', scale: 0.5, move: 0.8, hold: 0.9 },
    { x: 0.548, y: 0.770, scale: 0.45, move: 0.8, hold: 0 },
    { x: 0.450, y: 0.805, scale: 0.42, move: 0.8, hold: 0 },
    { x: 0.548, y: 0.840, scale: 0.40, move: 0.8, hold: 0 },
    { x: 0.460, y: 0.870, scale: 0.38, move: 0.8, hold: 0.4 },
    { x: 0.396, y: 0.870, text: 'The large intestine soaks up extra water.', scale: 0.36, move: 1.0, hold: 1.2 },
    { x: 0.396, y: 0.730, scale: 0.34, move: 1.0, hold: 0 },
    { x: 0.600, y: 0.715, scale: 0.34, move: 1.4, hold: 0 },
    { x: 0.598, y: 0.860, scale: 0.32, move: 1.0, hold: 0.3 },
    { x: 0.497, y: 0.925, text: 'What your body can\u2019t use leaves as poop. Your body kept the good stuff!', scale: 0.45, move: 1.0, hold: 2.4, emoji: '💩' }
  ];
  C.sceneLabels = [
    { name: 'Mouth', ax: 0.495, ay: 0.337, py: 0.29, left: false }, { name: 'Esophagus', ax: 0.506, ay: 0.50, py: 0.50, left: true },
    { name: 'Liver', ax: 0.44, ay: 0.655, py: 0.62, left: true }, { name: 'Stomach', ax: 0.565, ay: 0.668, py: 0.60, left: false },
    { name: 'Small intestine', ax: 0.54, ay: 0.78, py: 0.76, left: false }, { name: 'Large intestine', ax: 0.385, ay: 0.80, py: 0.82, left: true },
    { name: 'Rectum', ax: 0.497, ay: 0.925, py: 0.93, left: false }
  ];

  // Organ Lab
  C.labOrgans = [
    { id: 'lungs', title: 'Lungs', icon: 'IconLungs', heading: 'Discover how lungs work' },
    { id: 'heart', title: 'Heart', icon: 'IconHeart', heading: 'Feel your heart beat' },
    { id: 'brain', title: 'Brain', icon: 'IconBrain', heading: 'Meet your busy brain' },
    { id: 'stomach', title: 'Stomach', icon: 'IconStomach', heading: 'See your stomach churn' },
    { id: 'liver', title: 'Liver', icon: 'IconLiver', heading: 'Meet your helpful liver' },
    { id: 'small_intestine', title: 'Intestines', icon: 'IconIntestines', heading: 'Follow the winding tube' },
    { id: 'kidneys', title: 'Kidneys', icon: 'IconKidneys', heading: 'Meet your kidney filters' }
  ];

  // Realistic 3D
  function L(t, x, y, z) { return { text: t, off: [x, y, z] }; }
  C.realModels = [
    { id: 'body', title: 'Body', tag: 'Whole Body', color: '#5E5CE6', description: 'Explore the major organs working together inside the human body.', fact: 'Your body has 206 bones and over 600 muscles.',
      key: ['Brain', 'Heart', 'Lungs', 'Liver', 'Stomach', 'Intestines'],
      labels: [L('Brain', 0, 0.92, 0.05), L('Heart', 0.06, 0.62, 0.15), L('Lungs', 0, 0.68, 0.1), L('Liver', -0.1, 0.5, 0.12), L('Stomach', 0.1, 0.46, 0.12), L('Intestines', 0, 0.34, 0.12)] },
    { id: 'brain', title: 'Brain', tag: 'Nervous', color: '#AF52DE', description: 'Your brain helps you think, learn, move, and remember.', fact: 'Your brain uses about 20% of your body\u2019s energy.',
      key: ['Frontal lobe', 'Temporal lobe', 'Parietal lobe', 'Occipital lobe', 'Cerebellum', 'Brainstem'],
      labels: [L('Frontal Lobe', 0, 0.55, 0.5), L('Temporal Lobe', 0.6, 0.05, 0.1), L('Parietal Lobe', 0, 0.75, -0.1), L('Occipital Lobe', 0, 0.4, -0.6), L('Cerebellum', 0, -0.45, -0.45), L('Brainstem', 0, -0.7, -0.1)] },
    { id: 'heart', title: 'Heart', tag: 'Circulatory', color: '#FF3B30', description: 'Your heart is a muscle that pumps blood around your body.', fact: 'Your heart keeps pumping while you sleep.',
      key: ['Pumps blood throughout the body', 'Maintains blood pressure', 'Delivers oxygen and nutrients to tissues', 'Removes carbon dioxide and waste products'],
      labels: [L('Superior Vena Cava', 0.3, 0.9, 0.2), L('Aorta', -0.2, 0.95, 0), L('Right Atrium', 0.55, 0.35, 0.25), L('Tricuspid Valve', 0.3, 0.05, 0.35), L('Right Ventricle', 0.35, -0.35, 0.3), L('Left Ventricle', -0.35, -0.3, 0.25)] },
    { id: 'lungs', title: 'Lungs', tag: 'Respiratory', color: '#0A84FF', description: 'Your lungs help you breathe in oxygen and breathe out carbon dioxide.', fact: 'You breathe about 20,000 times per day.',
      key: ['Trachea', 'Bronchi', 'Left lung', 'Right lung', 'Diaphragm'],
      labels: [L('Trachea', 0, 0.95, 0.1), L('Right Lung', 0.5, 0.1, 0.1), L('Left Lung', -0.5, 0.1, 0.1), L('Bronchi', 0, 0.45, 0.2), L('Diaphragm', 0, -0.75, 0.1)] },
    { id: 'stomach', title: 'Stomach', tag: 'Digestive', color: '#34C759', description: 'Your stomach mixes food with digestive juices.', fact: 'Your stomach gets a new lining every few days.',
      key: ['Esophagus', 'Fundus', 'Pylorus', 'Duodenum'],
      labels: [L('Esophagus', 0.1, 0.95, 0), L('Fundus', -0.4, 0.45, 0.1), L('Pylorus', 0.55, -0.35, 0.1), L('Duodenum', 0.6, -0.6, 0)] },
    { id: 'liver', title: 'Liver', tag: 'Digestive', color: '#FF9500', description: 'Your liver processes nutrients and makes bile to help digest fats.', fact: 'The liver is the largest internal organ.',
      key: ['Right lobe', 'Left lobe', 'Gallbladder', 'Bile ducts'],
      labels: [L('Right Lobe', 0.45, 0.1, 0.15), L('Left Lobe', -0.5, 0.15, 0.1), L('Gallbladder', 0.1, -0.5, 0.3)] },
    { id: 'kidneys', title: 'Kidneys', tag: 'Urinary', color: '#30B0C7', description: 'Your kidneys filter your blood and make urine.', fact: 'Your kidneys remove waste and extra water from your blood.',
      key: ['Left kidney', 'Right kidney', 'Ureter', 'Renal artery'],
      labels: [L('Left Kidney', -0.55, 0.3, 0.1), L('Right Kidney', 0.55, 0.3, 0.1), L('Ureter', 0.4, -0.5, 0), L('Renal Artery', 0, 0.25, 0.25)] },
    { id: 'intestines', title: 'Intestines', tag: 'Digestive', color: '#FF2D55', description: 'Your intestines absorb nutrients and water from food.', fact: 'Your small intestine is over 6 metres long.',
      key: ['Small intestine', 'Large intestine', 'Cecum', 'Appendix'],
      labels: [L('Small Intestine', 0, -0.1, 0.3), L('Large Intestine', 0.55, 0.3, 0.2), L('Appendix', 0.45, -0.65, 0.25)] },
    { id: 'skull', title: 'Skull', tag: 'Skeletal', color: '#8E8E93', description: 'Your skull protects your brain and gives your face its shape.', fact: 'An adult skull has 22 bones.',
      key: ['Frontal bone', 'Orbit', 'Zygomatic bone', 'Maxilla', 'Mandible'],
      labels: [L('Frontal Bone', 0, 0.85, 0.35), L('Orbit', 0.3, 0.35, 0.55), L('Zygomatic Bone', 0.55, 0.05, 0.35), L('Maxilla', 0, -0.15, 0.5), L('Mandible', 0, -0.55, 0.45), L('Mental Foramen', 0.15, -0.5, 0.5)] }
  ];
  C.overview = ['brain', 'heart', 'lungs', 'liver', 'stomach', 'kidneys', 'small_intestine', 'large_intestine', 'bladder'];
})(window.HA);
