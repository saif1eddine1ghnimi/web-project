# Projet Web - Objectif 3

Groupe : 3
- Saif Eddine Ghnimi  
- Maissa Ben Mrad  
- Yasmine Hentati  

---

## 1. Choix du framework

Nous avons choisi **Node.js avec Express** pour le backend pour les raisons suivantes :  
- Léger et rapide pour servir les pages et gérer les requêtes HTTP.  
- Facile à connecter avec une base de données MySQL.  
- Large écosystème npm pour gérer les packages et dépendances.  

Pour le frontend, nous avons utilisé **HTML, CSS et JavaScript** avec npm pour la gestion des packages et des scripts. Cela permet d’avoir un site dynamique, responsive et facilement maintenable.

---

## 2. Fonctionnalités développées

1. **Écrans principaux :**  
   - Page d'accueil  
   - Page de login  
   - Dashboard admin
   - Dashboard Employee
   - Dashboard Client  

2. **Dashboard admin :**  
   - Ajouter un nouveau dossier via un formulaire (bouton "Ajouter nouveau dossier")  
   - Visualiser la liste des dossiers existants  
   - Gestion dynamique des données (CRUD minimal)
   - Affecter des tashes ppour les employées 
3. **Dashboard Employee :**  
   - Ajouter un nouveau dossier via un formulaire (bouton "Ajouter nouveau dossier")  
   - Visualiser la liste des dossiers existants  
   - Consulter les tashes affectés par le directeur
4. **Dashboard Client :**  
   - Consulter les dossiers personnels 


---

## 3. Étapes de lancement du projet

1. **Cloner le projet :**

git clone https://github.com/saif1eddine1ghnimi/web-project.git
cd web-project

2. **Installer les dépendances :** ( dans les terminals des dossiers backend puis frontend)

npm install


3. **Configurer la base de données MySQL :**

Créer une base web_project_db
Changer le code .env avec votre informations de connections MySql


4. **Lancer le serveur backend :**
   ouvrir terminal du backend , tapez npm install puis entrer puis tapez npm start puis entrer
5. **Lancer le serveur frontend :**
   ouvrir terminal du frontend , tapez npm install puis entrer puis tapez npm start puis entrer
6. Remarque ! : dans terminals backend et frontend , tapez npm install just une seul fois , puis dans les connections apart la premiere , vous pouvez de ne la taper plus
