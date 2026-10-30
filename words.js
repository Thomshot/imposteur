// Banque de paires de mots : une ligne = "mot A ; mot B".
// Au lancement d'une manche, l'un des deux est tiré au hasard pour les civils,
// l'autre pour les imposteurs.

const RAW = `
# Nourriture
Pizza ; Tarte flambée
Croissant ; Pain au chocolat
Baguette ; Pain de mie
Fromage ; Beurre
Camembert ; Brie
Raclette ; Fondue
Crêpe ; Gaufre
Hamburger ; Sandwich
Frites ; Chips
Pâtes ; Riz
Spaghetti ; Tagliatelles
Lasagnes ; Gratin
Sushi ; Maki
Kebab ; Tacos
Hot-dog ; Croque-monsieur
Quiche ; Tarte salée
Omelette ; Œuf au plat
Soupe ; Velouté
Salade ; Taboulé
Couscous ; Paella
Ratatouille ; Tian
Steak ; Côtelette
Poulet ; Dinde
Saucisson ; Jambon
Chorizo ; Salami
Pâté ; Rillettes
Foie gras ; Terrine
Huître ; Moule
Crevette ; Langoustine
Saumon ; Truite
Thon ; Sardine
Homard ; Crabe
Escargot ; Grenouille
Ketchup ; Mayonnaise
Moutarde ; Wasabi
Sel ; Poivre
Sucre ; Miel
Confiture ; Pâte à tartiner
Nutella ; Caramel
Chocolat noir ; Chocolat au lait
Bonbon ; Sucette
Chewing-gum ; Bonbon à la menthe
Glace ; Sorbet
Gâteau ; Tarte
Éclair ; Religieuse
Macaron ; Meringue
Cookie ; Brownie
Muffin ; Cupcake
Donut ; Beignet
Tiramisu ; Panna cotta
Crème brûlée ; Flan
Mousse au chocolat ; Fondant au chocolat
Pancake ; Crêpe
Céréales ; Muesli
Yaourt ; Fromage blanc
Popcorn ; Barbe à papa
Galette des rois ; Bûche de Noël
Pain d'épices ; Spéculoos
Madeleine ; Financier
Brioche ; Pain au lait
Chouquette ; Profiterole
Kinder ; Twix
Mars ; Snickers
Biscotte ; Pain grillé
Cornichon ; Olive
Noix ; Noisette
Amande ; Pistache
Cacahuète ; Noix de cajou

# Fruits & légumes
Pomme ; Poire
Orange ; Mandarine
Citron ; Citron vert
Banane ; Plantain
Fraise ; Framboise
Cerise ; Groseille
Myrtille ; Mûre
Pêche ; Abricot
Prune ; Mirabelle
Raisin ; Groseille à maquereau
Melon ; Pastèque
Ananas ; Mangue
Kiwi ; Fruit de la passion
Noix de coco ; Datte
Figue ; Grenade
Avocat ; Concombre
Tomate ; Poivron
Carotte ; Navet
Pomme de terre ; Patate douce
Courgette ; Aubergine
Brocoli ; Chou-fleur
Épinard ; Salade verte
Haricot vert ; Petit pois
Oignon ; Échalote
Ail ; Gingembre
Champignon ; Truffe
Potiron ; Courge
Maïs ; Blé
Radis ; Betterave
Poireau ; Céleri
Artichaut ; Asperge
Persil ; Coriandre
Basilic ; Menthe
Lentille ; Pois chiche

# Boissons
Café ; Thé
Expresso ; Cappuccino
Chocolat chaud ; Lait
Eau plate ; Eau gazeuse
Coca ; Pepsi
Limonade ; Sirop
Jus d'orange ; Jus de pomme
Smoothie ; Milkshake
Bière ; Cidre
Vin rouge ; Vin blanc
Champagne ; Prosecco
Rosé ; Sangria
Whisky ; Rhum
Vodka ; Gin
Pastis ; Ricard
Mojito ; Caïpirinha
Cocktail ; Punch
Red Bull ; Monster
Tisane ; Infusion

# Animaux
Chien ; Loup
Chat ; Tigre
Lion ; Tigre
Guépard ; Léopard
Cheval ; Âne
Zèbre ; Girafe
Vache ; Taureau
Mouton ; Chèvre
Cochon ; Sanglier
Poule ; Canard
Coq ; Dindon
Lapin ; Lièvre
Souris ; Rat
Hamster ; Cochon d'Inde
Écureuil ; Tamia
Renard ; Loup
Ours ; Panda
Ours polaire ; Pingouin
Pingouin ; Manchot
Aigle ; Faucon
Hibou ; Chouette
Corbeau ; Pie
Pigeon ; Colombe
Perroquet ; Toucan
Flamant rose ; Cigogne
Cygne ; Oie
Dauphin ; Requin
Baleine ; Orque
Phoque ; Otarie
Pieuvre ; Calamar
Méduse ; Étoile de mer
Tortue ; Escargot
Crocodile ; Alligator
Serpent ; Lézard
Grenouille ; Crapaud
Abeille ; Guêpe
Fourmi ; Termite
Papillon ; Libellule
Mouche ; Moustique
Araignée ; Scorpion
Coccinelle ; Scarabée
Chenille ; Ver de terre
Singe ; Gorille
Chimpanzé ; Orang-outan
Éléphant ; Rhinocéros
Hippopotame ; Rhinocéros
Kangourou ; Koala
Chameau ; Dromadaire
Lama ; Alpaga
Cerf ; Élan
Biche ; Chevreuil
Hérisson ; Porc-épic
Taupe ; Blaireau
Chauve-souris ; Vampire
Poisson rouge ; Carpe
Dinosaure ; Dragon
Licorne ; Pégase

# Maison & objets
Canapé ; Fauteuil
Chaise ; Tabouret
Table ; Bureau
Lit ; Hamac
Oreiller ; Coussin
Couette ; Couverture
Armoire ; Commode
Étagère ; Bibliothèque
Lampe ; Bougie
Miroir ; Fenêtre
Porte ; Portail
Clé ; Cadenas
Rideau ; Store
Tapis ; Paillasson
Frigo ; Congélateur
Four ; Micro-ondes
Grille-pain ; Bouilloire
Cafetière ; Théière
Lave-linge ; Lave-vaisselle
Aspirateur ; Balai
Serpillière ; Éponge
Fourchette ; Couteau
Cuillère ; Louche
Assiette ; Bol
Verre ; Tasse
Casserole ; Poêle
Bouteille ; Gourde
Brosse à dents ; Dentifrice
Shampoing ; Gel douche
Savon ; Gel hydroalcoolique
Serviette ; Peignoir
Douche ; Baignoire
Lavabo ; Évier
Toilettes ; Bidet
Radiateur ; Cheminée
Ventilateur ; Climatiseur
Parapluie ; Imperméable
Valise ; Sac à dos
Sac à main ; Pochette
Portefeuille ; Porte-monnaie
Montre ; Bracelet
Lunettes ; Lunettes de soleil
Bague ; Collier
Boucles d'oreilles ; Piercing
Ciseaux ; Cutter
Marteau ; Tournevis
Clou ; Vis
Scotch ; Colle
Stylo ; Crayon
Feutre ; Surligneur
Gomme ; Correcteur
Règle ; Équerre
Cahier ; Classeur
Livre ; Magazine
Journal ; Magazine
Carte postale ; Lettre
Enveloppe ; Colis
Calendrier ; Agenda
Réveil ; Horloge
Ballon ; Balle
Poupée ; Peluche
Puzzle ; Lego
Bougie ; Lampe torche
Briquet ; Allumette
Cendrier ; Poubelle
Échelle ; Escabeau
Tondeuse ; Taille-haie
Arrosoir ; Tuyau d'arrosage
Pelle ; Râteau
Brouette ; Chariot
Boîte aux lettres ; Interphone
Sonnette ; Klaxon

# Vêtements
T-shirt ; Chemise
Pull ; Sweat
Veste ; Manteau
Blouson ; Doudoune
Jean ; Pantalon
Short ; Bermuda
Jupe ; Robe
Chaussettes ; Collants
Baskets ; Chaussures de ville
Bottes ; Bottines
Sandales ; Tongs
Chaussons ; Pantoufles
Casquette ; Bonnet
Chapeau ; Béret
Écharpe ; Foulard
Gants ; Moufles
Cravate ; Nœud papillon
Ceinture ; Bretelles
Pyjama ; Robe de chambre
Maillot de bain ; Bikini
Costume ; Smoking
Tablier ; Blouse
Uniforme ; Déguisement
Kimono ; Kilt

# Corps & santé
Main ; Pied
Doigt ; Orteil
Bras ; Jambe
Genou ; Coude
Œil ; Oreille
Nez ; Bouche
Dent ; Langue
Cheveux ; Poils
Barbe ; Moustache
Cœur ; Poumon
Cerveau ; Crâne
Os ; Muscle
Sang ; Larme
Rhume ; Grippe
Fièvre ; Toux
Médecin ; Infirmier
Hôpital ; Clinique
Pharmacie ; Infirmerie
Pansement ; Plâtre
Seringue ; Vaccin
Pilule ; Sirop pour la toux
Dentiste ; Orthodontiste
Ambulance ; Camion de pompiers
Béquilles ; Fauteuil roulant

# Métiers
Policier ; Gendarme
Pompier ; Secouriste
Boulanger ; Pâtissier
Boucher ; Charcutier
Cuisinier ; Serveur
Professeur ; Instituteur
Avocat ; Juge
Architecte ; Ingénieur
Pilote ; Hôtesse de l'air
Astronaute ; Pilote de chasse
Plombier ; Électricien
Maçon ; Charpentier
Coiffeur ; Barbier
Facteur ; Livreur
Chauffeur de taxi ; Chauffeur de bus
Agriculteur ; Éleveur
Vétérinaire ; Médecin
Journaliste ; Écrivain
Acteur ; Chanteur
Photographe ; Caméraman
Peintre ; Sculpteur
Danseur ; Gymnaste
Magicien ; Clown
Banquier ; Comptable
Caissier ; Vendeur
Pharmacien ; Chimiste
Scientifique ; Inventeur
Détective ; Espion
Soldat ; Gardien
Pirate ; Corsaire
Chevalier ; Mousquetaire
Roi ; Empereur
Reine ; Princesse
Prince ; Duc
Président ; Premier ministre
Maire ; Député
Youtubeur ; Streamer
Influenceur ; Mannequin
DJ ; Rappeur
Développeur ; Hacker
Jardinier ; Paysagiste
Pêcheur ; Marin
Capitaine ; Amiral
Mécanicien ; Garagiste
Fleuriste ; Jardinier
Chirurgien ; Anesthésiste
Psychologue ; Psychiatre
Nounou ; Baby-sitter

# Lieux
Plage ; Piscine
Montagne ; Colline
Forêt ; Jungle
Désert ; Savane
Lac ; Étang
Rivière ; Fleuve
Mer ; Océan
Île ; Presqu'île
Grotte ; Tunnel
Volcan ; Geyser
Cascade ; Fontaine
Ville ; Village
Rue ; Avenue
Parc ; Jardin
Zoo ; Aquarium
Musée ; Galerie d'art
Cinéma ; Théâtre
Bibliothèque ; Librairie
École ; Collège
Lycée ; Université
Supermarché ; Épicerie
Boulangerie ; Pâtisserie
Restaurant ; Café
Bar ; Boîte de nuit
Hôtel ; Auberge
Camping ; Gîte
Gare ; Aéroport
Port ; Marina
Église ; Cathédrale
Château ; Palais
Prison ; Commissariat
Mairie ; Préfecture
Banque ; Poste
Stade ; Gymnase
Salle de sport ; Piscine
Parc d'attractions ; Fête foraine
Cirque ; Cabaret
Ferme ; Ranch
Usine ; Entrepôt
Bureau ; Open space
Cuisine ; Salle à manger
Chambre ; Salon
Grenier ; Cave
Garage ; Parking
Balcon ; Terrasse
Ascenseur ; Escalator
Pont ; Viaduc
Phare ; Tour
Cimetière ; Catacombes
Station de ski ; Station balnéaire
Centre commercial ; Marché

# Villes & pays
Paris ; Londres
Marseille ; Nice
Lyon ; Bordeaux
Toulouse ; Montpellier
Lille ; Strasbourg
Nantes ; Rennes
New York ; Los Angeles
Rome ; Venise
Madrid ; Barcelone
Berlin ; Munich
Tokyo ; Séoul
Pékin ; Shanghai
Moscou ; Saint-Pétersbourg
Bruxelles ; Amsterdam
Genève ; Lausanne
Dubaï ; Las Vegas
Montréal ; Québec
Rio de Janeiro ; Buenos Aires
France ; Belgique
Suisse ; Autriche
Espagne ; Portugal
Italie ; Grèce
Allemagne ; Pays-Bas
Angleterre ; Irlande
Canada ; États-Unis
Mexique ; Brésil
Japon ; Chine
Inde ; Thaïlande
Maroc ; Tunisie
Algérie ; Sénégal
Égypte ; Turquie
Australie ; Nouvelle-Zélande
Russie ; Ukraine
Suède ; Norvège
Islande ; Groenland
Corse ; Sardaigne
Bretagne ; Normandie

# Transports
Voiture ; Camion
Moto ; Scooter
Vélo ; Trottinette
Bus ; Tramway
Métro ; RER
Train ; TGV
Avion ; Hélicoptère
Fusée ; Navette spatiale
Bateau ; Voilier
Paquebot ; Ferry
Canoë ; Kayak
Sous-marin ; Bateau pirate
Taxi ; Uber
Tracteur ; Moissonneuse
Montgolfière ; Dirigeable
Skateboard ; Rollers
Téléphérique ; Télésiège
Jet-ski ; Pédalo
Ambulance ; Voiture de police
Caravane ; Camping-car
Calèche ; Carrosse
Parachute ; Parapente

# Sports & loisirs
Football ; Rugby
Basket ; Handball
Tennis ; Badminton
Ping-pong ; Squash
Volley ; Beach-volley
Golf ; Mini-golf
Natation ; Plongée
Surf ; Bodyboard
Ski ; Snowboard
Patin à glace ; Roller
Boxe ; Karaté
Judo ; Lutte
Escrime ; Kendo
Course à pied ; Marathon
Cyclisme ; VTT
Équitation ; Polo
Escalade ; Randonnée
Yoga ; Pilates
Musculation ; Crossfit
Danse ; Zumba
Pétanque ; Bowling
Fléchettes ; Billard
Échecs ; Dames
Poker ; Blackjack
Monopoly ; Cluedo
Uno ; Belote
Tarot ; Bridge
Loto ; Bingo
Puzzle ; Mots croisés
Sudoku ; Mots fléchés
Pêche ; Chasse
Camping ; Pique-nique
Karaoké ; Blind test
Cache-cache ; Chat perché
Balançoire ; Toboggan
Trampoline ; Château gonflable
Jeux olympiques ; Coupe du monde
Arbitre ; Entraîneur
But ; Panier
Médaille d'or ; Trophée
Formule 1 ; Rallye
Tour de France ; Paris-Roubaix

# Musique & arts
Guitare ; Basse
Piano ; Orgue
Violon ; Violoncelle
Batterie ; Tambour
Flûte ; Clarinette
Trompette ; Saxophone
Harpe ; Lyre
Accordéon ; Harmonica
Micro ; Haut-parleur
Casque audio ; Écouteurs
Concert ; Festival
Opéra ; Comédie musicale
Rap ; Rock
Jazz ; Blues
Pop ; Électro
Reggae ; Ska
Chorale ; Orchestre
Chef d'orchestre ; Compositeur
Disque vinyle ; CD
Peinture ; Dessin
Aquarelle ; Gouache
Statue ; Sculpture
Tableau ; Affiche
Tatouage ; Henné
Graffiti ; Fresque
Photo ; Selfie
Bande dessinée ; Manga
Roman ; Nouvelle
Poème ; Chanson
Conte ; Fable

# Films, séries & personnages
Harry Potter ; Le Seigneur des Anneaux
Star Wars ; Star Trek
Batman ; Superman
Spider-Man ; Iron Man
Hulk ; Thor
Wonder Woman ; Catwoman
Joker ; Dark Vador
Mickey ; Donald
Blanche-Neige ; Cendrillon
La Belle au bois dormant ; Raiponce
Le Roi lion ; Le Livre de la jungle
La Reine des neiges ; Raiponce
Shrek ; L'Âge de glace
Toy Story ; Monstres et Cie
Le Monde de Nemo ; La Petite Sirène
Pinocchio ; Peter Pan
Astérix ; Obélix
Tintin ; Spirou
Les Schtroumpfs ; Les Minions
Pikachu ; Rondoudou
Naruto ; One Piece
Dragon Ball ; Pokémon
Mario ; Luigi
Sonic ; Pac-Man
Zelda ; Link
Titanic ; Avatar
Jurassic Park ; King Kong
Les Bronzés ; Les Visiteurs
Bienvenue chez les Ch'tis ; Intouchables
James Bond ; Mission Impossible
Sherlock Holmes ; Hercule Poirot
Dracula ; Frankenstein
Zombie ; Vampire
Fantôme ; Squelette
Sorcière ; Magicien
Fée ; Elfe
Ogre ; Troll
Sirène ; Triton
Père Noël ; Lutin
Lapin de Pâques ; Petite souris
Robin des Bois ; Zorro
Cendrillon ; Belle
Game of Thrones ; The Witcher
Stranger Things ; Squid Game
Friends ; How I Met Your Mother
Les Simpson ; Family Guy
Bob l'éponge ; Patrick
Scooby-Doo ; Les Razmoket
Netflix ; Disney+
Oscar ; César
Hollywood ; Bollywood

# Technologie
Téléphone ; Smartphone
Ordinateur ; Tablette
Ordinateur portable ; PC fixe
Clavier ; Souris
Écran ; Télévision
Imprimante ; Scanner
Clé USB ; Disque dur
Wi-Fi ; Bluetooth
Internet ; Intranet
Google ; Wikipédia
Facebook ; Instagram
TikTok ; Snapchat
Twitter ; Threads
WhatsApp ; Messenger
YouTube ; Twitch
Spotify ; Deezer
Amazon ; Cdiscount
iPhone ; Samsung
PlayStation ; Xbox
Nintendo Switch ; Game Boy
Manette ; Joystick
Console ; Borne d'arcade
Robot ; Androïde
Drone ; Avion téléguidé
Appareil photo ; Caméra
Batterie ; Chargeur
Mot de passe ; Code PIN
Email ; SMS
Émoji ; Sticker
Virus ; Bug
Intelligence artificielle ; Robot
Montre connectée ; Bracelet connecté
Télécommande ; Manette
Calculatrice ; Boulier
GPS ; Carte routière

# Nature & météo
Soleil ; Lune
Étoile ; Planète
Comète ; Météorite
Nuage ; Brouillard
Pluie ; Averse
Neige ; Grêle
Orage ; Tempête
Éclair ; Tonnerre
Arc-en-ciel ; Aurore boréale
Vent ; Tornade
Ouragan ; Cyclone
Tremblement de terre ; Tsunami
Été ; Printemps
Hiver ; Automne
Arbre ; Buisson
Fleur ; Plante
Rose ; Tulipe
Marguerite ; Tournesol
Sapin ; Pin
Chêne ; Hêtre
Palmier ; Cocotier
Cactus ; Aloe vera
Herbe ; Mousse
Feuille ; Branche
Sable ; Gravier
Caillou ; Rocher
Glace ; Glaçon
Feu ; Braise
Vague ; Marée
Coquillage ; Galet
Lever de soleil ; Coucher de soleil
Matin ; Soir
Nuit ; Minuit

# Fêtes & événements
Noël ; Nouvel An
Halloween ; Carnaval
Pâques ; Chandeleur
Anniversaire ; Fête
Mariage ; Fiançailles
Baptême ; Communion
Saint-Valentin ; Fête des mères
14 Juillet ; Fête de la musique
Feu d'artifice ; Pétard
Sapin de Noël ; Guirlande
Cadeau ; Surprise
Ballon de baudruche ; Confettis
Gâteau d'anniversaire ; Bougie
Enterrement de vie de garçon ; Enterrement de vie de jeune fille
Lune de miel ; Voyage de noces
Vacances ; Week-end
Rentrée ; Examen
Bac ; Brevet
Diplôme ; Certificat
Déménagement ; Emménagement
Soirée pyjama ; Soirée jeux
Barbecue ; Pique-nique
Apéro ; Brunch
Réveillon ; Gala

# Concepts & divers
Amour ; Amitié
Rêve ; Cauchemar
Sommeil ; Sieste
Rire ; Sourire
Pleurer ; Crier
Joie ; Bonheur
Peur ; Angoisse
Colère ; Jalousie
Argent ; Or
Billet ; Pièce
Carte bancaire ; Chèque
Trésor ; Coffre-fort
Diamant ; Rubis
Or ; Argent
Fer ; Acier
Bois ; Carton
Papier ; Plastique
Verre ; Cristal
Lumière ; Ombre
Silence ; Bruit
Secret ; Mensonge
Vérité ; Promesse
Chance ; Hasard
Victoire ; Défaite
Guerre ; Bataille
Paix ; Trêve
Héros ; Super-héros
Méchant ; Vilain
Voleur ; Cambrioleur
Police ; Armée
Épée ; Sabre
Arc ; Arbalète
Bouclier ; Armure
Pistolet ; Fusil
Bombe ; Grenade
Château fort ; Donjon
Couronne ; Diadème
Trône ; Sceptre
Carte au trésor ; Boussole
Loupe ; Jumelles
Télescope ; Microscope
Horoscope ; Astrologie
Tarot ; Boule de cristal
Fantôme ; Esprit
Ange ; Démon
Paradis ; Enfer
Dieu ; Prophète
Bible ; Coran
Prière ; Méditation
Bébé ; Enfant
Grand-père ; Grand-mère
Frère ; Cousin
Oncle ; Parrain
Voisin ; Colocataire
Mari ; Fiancé
Professeur ; Directeur
Élève ; Étudiant
Patron ; Collègue
Ami ; Meilleur ami
Ennemi ; Rival
Selfie ; Portrait
Musique ; Bruit
Histoire ; Géographie
Mathématiques ; Physique
Français ; Anglais
Anglais ; Allemand
Espagnol ; Italien
Lundi ; Vendredi
Samedi ; Dimanche
Janvier ; Décembre
Matin ; Après-midi
Seconde ; Minute
Heure ; Jour
Mois ; Année
Siècle ; Millénaire
Rouge ; Rose
Bleu ; Turquoise
Vert ; Kaki
Jaune ; Orange
Noir ; Gris
Blanc ; Beige
Violet ; Mauve
Marron ; Bordeaux
Cercle ; Ovale
Carré ; Rectangle
Triangle ; Pyramide
Cube ; Dé
Zéro ; Un
Pile ; Face
Gauche ; Droite
Haut ; Bas
Chaud ; Froid
Grand ; Géant
Petit ; Minuscule
Rapide ; Pressé
Lent ; Paresseux
Riche ; Millionnaire
Pauvre ; Mendiant
Jeune ; Adolescent
Vieux ; Ancien
Beau ; Joli
Moche ; Laid
Fort ; Musclé
Intelligent ; Génie
Fou ; Bizarre
Timide ; Discret
Gourmand ; Glouton
Dormir ; Rêver
Manger ; Boire
Courir ; Marcher
Sauter ; Danser
Nager ; Plonger
Chanter ; Siffler
Lire ; Écrire
Parler ; Chuchoter
Cuisiner ; Pâtisser
Jouer ; Gagner
Voyager ; Explorer
Construire ; Bricoler
Peindre ; Dessiner
Tricher ; Mentir
Embrasser ; Câliner
Applaudir ; Acclamer
Bâiller ; S'étirer
Éternuer ; Tousser
Ronfler ; Respirer
`;

const WORD_PAIRS = RAW.split('\n')
  .map((line) => line.trim())
  .filter((line) => line && !line.startsWith('#'))
  .map((line) => line.split(';').map((w) => w.trim()))
  .filter((pair) => pair.length === 2 && pair[0] && pair[1] && pair[0] !== pair[1]);

module.exports = WORD_PAIRS;
