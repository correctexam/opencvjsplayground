# Outil de détection des cases cochées sur Python
## Aperçu
Les résultats peuvent être sous forme d'images ou de JSON.
Sur l'image, le chiffre en bleu est l'analyse du taux de remplissage de la case. Si celui-ci dépasse un certain seuil, alors la case est considérée comme cochée.
<img src="https://user-images.githubusercontent.com/62034725/181284736-6b8de2cf-a5ca-4355-82c7-30976568c851.png" alt="detection_eleve_q1" height="400" />
<img src="https://user-images.githubusercontent.com/62034725/181285381-ffa3b0f4-60c3-4d0b-8193-f1e574b795fc.png" alt="detection_eleve_q2" height="400" />

## Librairies utilisées
Ce projet dépend de plusieurs librairies : 
- ``pdf2image`` qui permet de convertir le pdf de chaque scan en image 
- ``openCV`` pour mannipuler et appliquer différents traitements sur les images : lecture, enregistrement, repérage de formes, changement de format...
- ``numpy`` pour ses tableaux et outils mathématiques
- ``pyinterval`` pour facilement détecter si une forme est en intersection avec une autre

Celles-ci peuvent être directement installées avec la commande 

      pip install -r requirements.txt


## Structure à adopter
Des dossiers et fichiers vont y être ajoutés. Le résultat de l'analyse se trouvera dans un dossier Temp (à la racine du projet)  
```
OPENCVPYTHON
│   README.md
│   calibration.py
|   const.py
|   main.py
|   systeme.py
|   tools.py    
│
└───resource
    │
    └───un_examen
    │   │   un_examen.pdf
    │   │   copie_1.pdf
    │   │   copie_2.pdf
    │   │   ...
    │   │   copie_15.pdf
    │
    └───un_autre_examen
        │   un_autre_examen.pdf
        │   copie_1.pdf
        │   copie_2.pdf
        │   ...
        │   copie_25.pdf
```

# Exécuter le projet
Le projet étant un projet python on l'exécute de la manière la plus classique qui soit.
```bash
python3 main.py
```
Dans le fichier *main.py*, commenter/décommenter l'appel aux différentes fonctions.
## Procédure à suivre pour obtenir l'analyse des cases dans un QCM
Suivre la procédure qui suit.
1. Ouvrir le fichier *const.py*
2. Modifier la variable **EXAM_COURANT** en la remplaçant par le **nom du dossier contenant l'examen**
3. Modifier la variable **NB_QUESTIONS** en la remplaçant par le **nombre de questions** que l'examen contient
4. Modifier la variable **NB_ELEVES** en la remplaçant par le **nombre de copies** situées dans le dossier copies de l'examen courant
5. Ouvrir le fichier *main.py*, et sélectionner la fonction *main()*
6. Commenter tous les appels de fonctions, sauf celui de *premiereFois()*. **Exécuter**
7. Ouvrir l'image *Temp/info_zones.png*. Et repérer les coordonnées *(x_min,y_min)* des différentes zones de questions à analyser
8. Revenir au fichier *const.py*
9. Modifier la variable **ZONES_COURANTES** en renseignant dans le tableau de tuples pour chaque zone le tuple suivant : *((x_min,y_min)(largeur,hauteur))*. Diminuer les valeurs *(x_min,y_min)* d'au moins 50 et prendre plusieurs centaines de pixels pour *largeur* et *hauteur*.
10. Revenir au fichier *main.py*, dans *main()*
11. Commenter l'appel à *premiereFois()* et décommenter *calibrer()*. **Exécuter**
12. Vérifier que les fichiers *reponse_qX.png* contiennent chacun la zone de réponse (en noir et blanc). Revenir au point 9. si ce n'est pas le cas
13. Revenir au fichier *main.py*, dans *main()*
14. Commenter l'appel à *calibrer()* et décommenter *interpretationQCM(NB_QUESTIONS,NB_ELEVES)*. **Exécuter**
15. Le résultat de l'analyse se trouve dans le dossier *Temp* avec les fichiers *detection_eleve_X_q_Y.png* (pour l'aperçu graphique) et dans le fichier *analyse.json* (pour les informations brutes)
16. Sauvegarder les fichiers produits dans un dossier externe.
17. Commenter *interpretationQCM(NB_QUESTIONS,NB_ELEVES)* et décommenter reinitStructureAnalyse(). **Exécuter**
