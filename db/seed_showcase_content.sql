SET NAMES utf8mb4;

START TRANSACTION;

DELETE FROM `events`
WHERE `title` IN ('test', 'Event jury')
  AND `participants` = 0;

INSERT INTO `events` (`title`, `date`, `location`, `lat`, `lng`, `image`, `status`, `participants`, `description`)
SELECT 'Marche douce au Bois de la Cambre', '2026-06-14', 'Bois de la Cambre, Bruxelles', 50.8029, 4.3816, '/images/events/event-5.jpg', 'Ouvert', 18,
       'Une matinée accessible pour reprendre contact avec la nature, rencontrer de nouvelles personnes et profiter d''un parcours calme au coeur de Bruxelles. Le rythme est adapté aux débutants.'
WHERE NOT EXISTS (
  SELECT 1 FROM `events` WHERE `title` = 'Marche douce au Bois de la Cambre' AND `date` = '2026-06-14'
);

INSERT INTO `events` (`title`, `date`, `location`, `lat`, `lng`, `image`, `status`, `participants`, `description`)
SELECT 'Atelier respiration et nature', '2026-06-21', 'Parc de Woluwe, Bruxelles', 50.8290, 4.4346, '/images/events/event-6.jpg', 'Ouvert', 14,
       'Un atelier en petit groupe pour apprendre des exercices simples de respiration, réduire le stress et partager un moment bienveillant dans un cadre verdoyant.'
WHERE NOT EXISTS (
  SELECT 1 FROM `events` WHERE `title` = 'Atelier respiration et nature' AND `date` = '2026-06-21'
);

INSERT INTO `events` (`title`, `date`, `location`, `lat`, `lng`, `image`, `status`, `participants`, `description`)
SELECT 'Balade patrimoine et sentiers à Namur', '2026-07-05', 'Citadelle de Namur', 50.4597, 4.8609, '/images/events/event-8.jpg', 'Ouvert', 22,
       'Une sortie entre nature et patrimoine pour découvrir les sentiers autour de la citadelle, avec des pauses d''échange et un parcours pensé pour rester convivial.'
WHERE NOT EXISTS (
  SELECT 1 FROM `events` WHERE `title` = 'Balade patrimoine et sentiers à Namur' AND `date` = '2026-07-05'
);

INSERT INTO `events` (`title`, `date`, `location`, `lat`, `lng`, `image`, `status`, `participants`, `description`)
SELECT 'Découverte des plantes comestibles', '2026-07-18', 'Jardin botanique de Meise', 50.9278, 4.3268, '/images/events/event-9.jpg', 'Ouvert', 16,
       'Une activité encadrée pour identifier quelques plantes utiles, comprendre les bons réflexes de cueillette responsable et échanger autour de pratiques durables.'
WHERE NOT EXISTS (
  SELECT 1 FROM `events` WHERE `title` = 'Découverte des plantes comestibles' AND `date` = '2026-07-18'
);

INSERT INTO `events` (`title`, `date`, `location`, `lat`, `lng`, `image`, `status`, `participants`, `description`)
SELECT 'Coucher de soleil à la côte', '2026-08-02', 'Digue de Knokke-Heist', 51.3456, 3.2878, '/images/events/event-7.jpg', 'Ouvert', 28,
       'Une marche de fin de journée le long de la mer du Nord, idéale pour discuter, respirer et terminer la semaine dans une ambiance simple et ressourçante.'
WHERE NOT EXISTS (
  SELECT 1 FROM `events` WHERE `title` = 'Coucher de soleil à la côte' AND `date` = '2026-08-02'
);

INSERT INTO `events` (`title`, `date`, `location`, `lat`, `lng`, `image`, `status`, `participants`, `description`)
SELECT 'Randonnée solidaire dans les Hautes Fagnes', '2026-08-23', 'Signal de Botrange, Waimes', 50.5011, 6.0931, '/images/events/event-8.jpg', 'Ouvert', 24,
       'Une randonnée un peu plus sportive, organisée avec un esprit d''entraide. Plusieurs pauses sont prévues pour permettre au groupe de rester ensemble.'
WHERE NOT EXISTS (
  SELECT 1 FROM `events` WHERE `title` = 'Randonnée solidaire dans les Hautes Fagnes' AND `date` = '2026-08-23'
);

INSERT INTO `events` (`title`, `date`, `location`, `lat`, `lng`, `image`, `status`, `participants`, `description`)
SELECT 'Matinée bénévoles: nettoyer un sentier', '2026-09-06', 'Forêt de Soignes, Auderghem', 50.7896, 4.4105, '/images/events/event-5.jpg', 'Ouvert', 20,
       'Une action concrète pour prendre soin d''un sentier, suivie d''un moment convivial. Gants et sacs sont prévus, il suffit de venir avec de bonnes chaussures.'
WHERE NOT EXISTS (
  SELECT 1 FROM `events` WHERE `title` = 'Matinée bénévoles: nettoyer un sentier' AND `date` = '2026-09-06'
);

INSERT INTO `events` (`title`, `date`, `location`, `lat`, `lng`, `image`, `status`, `participants`, `description`)
SELECT 'Initiation photo nature', '2026-09-20', 'Parc Tournay-Solvay, Watermael-Boitsfort', 50.7952, 4.4136, '/images/events/event-10.jpg', 'Ouvert', 12,
       'Une sortie créative pour apprendre à observer la lumière, composer une image et raconter une balade autrement. Smartphone ou appareil photo bienvenus.'
WHERE NOT EXISTS (
  SELECT 1 FROM `events` WHERE `title` = 'Initiation photo nature' AND `date` = '2026-09-20'
);

INSERT INTO `events` (`title`, `date`, `location`, `lat`, `lng`, `image`, `status`, `participants`, `description`)
SELECT 'Marche intergénérationnelle à Liège', '2026-10-04', 'Parc de la Boverie, Liège', 50.6326, 5.5797, '/images/events/event-6.jpg', 'Ouvert', 26,
       'Une activité pensée pour mélanger les âges et favoriser la conversation. Parcours court, pauses régulières et accueil des personnes seules.'
WHERE NOT EXISTS (
  SELECT 1 FROM `events` WHERE `title` = 'Marche intergénérationnelle à Liège' AND `date` = '2026-10-04'
);

INSERT INTO `events` (`title`, `date`, `location`, `lat`, `lng`, `image`, `status`, `participants`, `description`)
SELECT 'Veillée nature et observation du ciel', '2026-10-17', 'Citadelle de Dinant', 50.2609, 4.9122, '/images/events/event-10.jpg', 'Ouvert', 18,
       'Une soirée calme pour observer le ciel, écouter quelques récits liés aux paysages et partager une boisson chaude. Activité dépendante de la météo.'
WHERE NOT EXISTS (
  SELECT 1 FROM `events` WHERE `title` = 'Veillée nature et observation du ciel' AND `date` = '2026-10-17'
);

DELETE FROM `blog_articles`
WHERE `slug` IN (
  'creer-du-lien-par-les-evenements-nature',
  'organiser-une-sortie-locale-sans-complexite',
  'pourquoi-la-nature-aide-a-rompre-l-isolement',
  'bien-preparer-sa-premiere-marche-en-groupe',
  'donner-de-la-visibilite-aux-initiatives-locales'
);

INSERT INTO `blog_articles` (`title`, `slug`, `excerpt`, `image`, `content`, `author`, `published_at`)
VALUES
(
  'Créer du lien grâce aux événements nature',
  'creer-du-lien-par-les-evenements-nature',
  'Pourquoi une activité simple, locale et bien encadrée peut aider à recréer du contact humain.',
  '/images/articles/article-1.jpg',
  '<p>Un événement nature n''a pas besoin d''être spectaculaire pour avoir de l''impact. Une marche accessible, un atelier en petit groupe ou une sortie encadrée peuvent devenir des occasions concrètes de rencontrer des personnes et de reprendre confiance.</p><p>Au Fil des Sentiers part d''une idée simple: faciliter le passage entre l''envie de sortir et le moment où l''on ose réellement rejoindre un groupe.</p><h2>Un cadre rassurant</h2><p>Le lieu, le rythme, le nombre de participants et la description de l''activité aident chacun à savoir à quoi s''attendre. Cette clarté réduit la peur de ne pas être à sa place.</p><h2>Une réponse locale</h2><p>Les associations, communes et collectifs disposent souvent d''initiatives utiles, mais manquent parfois d''un espace simple pour les rendre visibles. La plateforme sert de point de rencontre entre ces acteurs et le public.</p>',
  'Équipe Au Fil des Sentiers',
  '2026-05-18 09:00:00'
),
(
  'Organiser une sortie locale sans complexité',
  'organiser-une-sortie-locale-sans-complexite',
  'Les éléments essentiels pour transformer une idée d''activité en événement clair et accueillant.',
  '/images/articles/article-2.jpg',
  '<p>Pour une ASBL ou une structure locale, proposer un événement ne devrait pas devenir une charge administrative. Les informations les plus importantes restent simples: une date, un lieu, une description honnête, un niveau d''accessibilité et un moyen de suivre les inscriptions.</p><p>Une bonne fiche d''événement permet aux participants de se projeter rapidement.</p><h2>Ce qu''il faut préciser</h2><p>Le point de rendez-vous, la durée approximative, le matériel conseillé et le type de public attendu sont des détails qui changent beaucoup l''expérience utilisateur.</p><h2>Garder une relation humaine</h2><p>La demande d''événement via le contact permet de vérifier les informations avant publication et d''accompagner les organisateurs qui n''ont pas encore l''habitude des outils numériques.</p>',
  'Équipe Au Fil des Sentiers',
  '2026-05-20 10:30:00'
),
(
  'Pourquoi la nature aide à rompre l''isolement',
  'pourquoi-la-nature-aide-a-rompre-l-isolement',
  'Marcher côte à côte rend parfois les échanges plus simples qu''une rencontre frontale.',
  '/images/articles/article-3.jpg',
  '<p>La nature offre un contexte particulier: on peut parler, observer, marcher en silence ou simplement partager un moment sans pression. Pour des personnes isolées, ce cadre peut rendre la rencontre moins intimidante.</p><p>Les événements de plein air donnent aussi un objectif commun. On ne vient pas seulement pour discuter, on vient vivre une activité.</p><h2>Un rythme plus doux</h2><p>Le mouvement aide à fluidifier les échanges. Les conversations naissent souvent pendant les pauses, devant un paysage ou autour d''une consigne donnée par l''animateur.</p><h2>Des liens qui peuvent continuer</h2><p>Quand les événements sont réguliers, les participants retrouvent des visages connus. C''est cette répétition, simple et locale, qui peut transformer une sortie en véritable habitude sociale.</p>',
  'Équipe Au Fil des Sentiers',
  '2026-05-22 08:45:00'
),
(
  'Bien préparer sa première marche en groupe',
  'bien-preparer-sa-premiere-marche-en-groupe',
  'Quelques repères pour participer sereinement à un premier événement nature.',
  '/images/articles/placeholder.jpg',
  '<p>Rejoindre un groupe pour la première fois peut demander un petit effort. Le plus important est de choisir une activité adaptée à son rythme et de lire attentivement les informations pratiques.</p><h2>Avant de partir</h2><p>Prévoir de l''eau, des chaussures confortables, une veste adaptée à la météo et arriver quelques minutes avant le départ suffit souvent pour vivre l''activité dans de bonnes conditions.</p><h2>Pendant l''activité</h2><p>Il n''est pas nécessaire de parler à tout le monde immédiatement. Participer, écouter et avancer avec le groupe est déjà une manière d''être présent.</p>',
  'Équipe Au Fil des Sentiers',
  '2026-05-24 11:15:00'
),
(
  'Donner de la visibilité aux initiatives locales',
  'donner-de-la-visibilite-aux-initiatives-locales',
  'Comment une plateforme claire peut aider les associations et communes à toucher le bon public.',
  '/images/articles/article-2.jpg',
  '<p>De nombreuses initiatives locales existent déjà: marches, ateliers, actions bénévoles, sorties bien-être ou projets citoyens. Leur difficulté n''est pas toujours l''organisation, mais la visibilité.</p><p>Une plateforme dédiée permet de centraliser les propositions et de rendre les événements plus faciles à découvrir.</p><h2>Un bénéfice pour les organisateurs</h2><p>Les structures locales gagnent un espace de présentation clair et un canal de contact plus direct avec les participants.</p><h2>Un bénéfice pour le public</h2><p>Les visiteurs peuvent comparer les activités, choisir selon leur disponibilité et s''inscrire sans devoir chercher dans plusieurs canaux différents.</p>',
  'Équipe Au Fil des Sentiers',
  '2026-05-26 14:00:00'
);

COMMIT;
