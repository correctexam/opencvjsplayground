# Outil de détection des cases cochées sur Python
## Librairies à installer
- Librairies dédiées à la découpe de l'examen en images calibrées
  - ghostscript
    
        pip install ghostscript

  - pdf2image

        pip install pdf2image

- Librairies nécessaires pour la détection des cases cochées dans une image
  -  openCV
  
         pip install opencv-python


  -  numpy
  
         pip install pyinterval

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
