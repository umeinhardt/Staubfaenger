Ich möchte die Aggrgation von Staubkörnen simulieren. Hier die Parameter für den Prototypen. Es soll von Anfang an eine mögliche Erweiterung in zusätzliche Raumdimensionen offen gehalten werden.
Teilchen und Staubkörner sind synonym.
* Die Simulation soll in einem Webbrowser angezeigt werden.
* Die Rechen- und Darstellungsgeschwindigkeit soll maximiert werden
* Die Simulation besteht darin, dass Staubkörner in eine 2-dimensionale Ebene mit unterschiedlichen Geschwindigkeiten eintreten und sich in dieser in Abhängigkeit von anderen Staubkörnern bewegen und, bei kontakt, verklumpen.
* Die Rate, mit der die Staubkörner eintreten, soll definierbar sein. (GUI)* Die initiale Energie, mit der sie eintreten soll un einem vorgegebenen Rahmen (GUI) definierbar sein
* Ihre Masse, soll in einem vorgegebenen Rahmen (GUI) definierbar sein
* Die Masse eines Teilchens soll durch die dessen Größe dargestellt werden
* Der Winkel, in dem ein Teilchen eintritt eintritt, soll zufällig sein.
* Die Position an der ein Teilchen eintritt eintritt, soll zufällig sein.
* Die Staubkörner bewegen sich mir ihrer initialgeschwindigkeit durch durch die ebene.
* nähern sich zwei Staubkörnchen an, so sollen sie reagieren, wie massebehaftete Teilchen und dabei den Newtonschen Gesetzen folgen
* berühren sich zwei Teilchen, so klumpen sie zusammen und bilden ein neues Teilchen.
  * Dabei verschmelzen sie nicht einfach, sondern bleiben als individuelle Elemente aneinandergeheftet
  * Die Masse der Teilchen addiert sich dabei
  * Die Bewegung des neuen Teilchens errechnet sich aus den beiden Bewegungsvektoren der beteiligten Teilchen
  * Konglunerate können einen Drehimpuls aufzeigen, der ebenfalls dargestellt wird.