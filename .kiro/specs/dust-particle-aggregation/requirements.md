# Requirements Document: Staubkorn-Aggregationssimulation

## Einführung

Die Staubkorn-Aggregationssimulation ist eine physikalische Simulation, die die Aggregation von Staubkörnern in einer 2D-Ebene darstellt. Staubkörner treten mit unterschiedlichen Geschwindigkeiten und Massen in die Simulationsebene ein, bewegen sich gemäß Newton'scher Mechanik und verklumpen bei Kontakt zu größeren Konglomeraten. Die Simulation läuft im Webbrowser und ist auf maximale Performance optimiert.

## Glossar

- **Staubkorn**: Ein einzelnes Teilchen in der Simulation mit Masse, Position und Geschwindigkeit
- **Teilchen**: Synonym für Staubkorn
- **Konglomerat**: Ein zusammengesetztes Objekt aus mehreren verklebten Staubkörnern
- **Simulationsebene**: Die 2D-Ebene, in der sich die Staubkörner bewegen
- **System**: Die gesamte Simulationsanwendung
- **GUI**: Die grafische Benutzeroberfläche zur Steuerung der Simulation
- **Eintrittsrate**: Die Anzahl der Staubkörner, die pro Zeiteinheit in die Simulation eintreten
- **Initialenergie**: Die kinetische Energie, mit der ein Staubkorn in die Simulation eintritt
- **Kollisionselastizität**: Der Koeffizient, der bestimmt, wie viel Energie bei einer Kollision erhalten bleibt (0 = vollständig inelastisch)
- **Gravitationsformel**: Die mathematische Formel zur Berechnung der Anziehungskraft zwischen Teilchen

## Anforderungen

### Anforderung 1: Darstellung im Webbrowser

**User Story:** Als Benutzer möchte ich die Simulation in einem Webbrowser ausführen, damit ich keine zusätzliche Software installieren muss.

#### Akzeptanzkriterien

1. DAS System SOLL in modernen Webbrowsern (Chrome, Firefox, Safari, Edge) lauffähig sein
2. WENN die Simulation gestartet wird, DANN SOLL das System die Simulationsebene visuell darstellen
3. DAS System SOLL die Darstellung kontinuierlich aktualisieren, um Bewegungen in Echtzeit zu zeigen

### Anforderung 2: Performance-Optimierung

**User Story:** Als Benutzer möchte ich eine flüssige Simulation mit vielen Teilchen, damit die Aggregation realistisch dargestellt wird.

#### Akzeptanzkriterien

1. DAS System SOLL die Rechen- und Darstellungsgeschwindigkeit maximieren
2. WENN die Simulation läuft, DANN SOLL das System mindestens 30 Frames pro Sekunde erreichen
3. DAS System SOLL effiziente Datenstrukturen für Kollisionserkennung verwenden
4. DAS System SOLL eine GUI zur Einstellung des Verhältnisses zwischen Genauigkeit und Flüssigkeit bereitstellen
5. WENN der Genauigkeitsregler angepasst wird, DANN SOLL das System die Berechnungsschritte entsprechend anpassen

### Anforderung 3: Teilcheneintritt und -austritt

**User Story:** Als Benutzer möchte ich kontrollieren, wie Staubkörner in die Simulation eintreten, damit ich verschiedene Szenarien testen kann.

#### Akzeptanzkriterien

1. DAS System SOLL Staubkörner kontinuierlich in die Simulationsebene einführen
2. WENN ein Staubkorn eintritt, DANN SOLL das System eine zufällige Position am Rand der Simulationsebene wählen
3. WENN ein Staubkorn eintritt, DANN SOLL das System einen zufälligen Eintrittswinkel wählen
4. WENN ein Staubkorn eintritt, DANN SOLL das System eine Initialenergie innerhalb des konfigurierten Bereichs zuweisen
5. WENN ein Staubkorn eintritt, DANN SOLL das System eine Masse innerhalb des konfigurierten Bereichs zuweisen
6. WENN ein Teilchen die Simulationsebene verlässt, DANN SOLL das System es auf der gegenüberliegenden Seite mit denselben Parametern wieder eintreten lassen

### Anforderung 4: GUI-Konfiguration

**User Story:** Als Benutzer möchte ich Simulationsparameter über eine GUI anpassen, damit ich verschiedene Bedingungen untersuchen kann.

#### Akzeptanzkriterien

1. DAS System SOLL eine GUI zur Konfiguration der Eintrittsrate bereitstellen
2. DAS System SOLL eine GUI zur Konfiguration des Initialenergiebereichs bereitstellen
3. DAS System SOLL eine GUI zur Konfiguration des Massenbereichs bereitstellen
4. DAS System SOLL eine GUI zur Auswahl der Farbkodierung bereitstellen
5. DAS System SOLL eine GUI zur Konfiguration der Kollisionselastizität bereitstellen
6. WENN ein Parameter geändert wird, DANN SOLL das System die Änderung sofort auf neu eintretende Teilchen anwenden

### Anforderung 5: Visuelle Darstellung der Masse

**User Story:** Als Benutzer möchte ich die Masse eines Teilchens visuell erkennen, damit ich die Aggregation besser verstehen kann.

#### Akzeptanzkriterien

1. WENN ein Teilchen dargestellt wird, DANN SOLL das System die Größe proportional zur Masse darstellen
2. WENN Teilchen zu einem Konglomerat verschmelzen, DANN SOLL das System die Größe entsprechend der Gesamtmasse anpassen

### Anforderung 6: Newton'sche Mechanik

**User Story:** Als Benutzer möchte ich eine physikalisch korrekte Simulation, damit die Ergebnisse realistisch sind.

#### Akzeptanzkriterien

1. WENN sich zwei Staubkörner annähern, DANN SOLL das System die Gravitationskraft zwischen ihnen berechnen
2. WENN Kräfte auf ein Teilchen wirken, DANN SOLL das System die Bewegung gemäß F = ma berechnen
3. WENN zwei Teilchen kollidieren, DANN SOLL das System die Impulserhaltung anwenden
4. WENN zwei Teilchen kollidieren, DANN SOLL das System die Kollisionselastizität berücksichtigen
5. DAS System SOLL standardmäßig die Newton'sche Gravitationsformel verwenden
6. DAS System SOLL eine erweiterbare Architektur für alternative Gravitationsformeln bereitstellen

### Anforderung 7: Teilchenaggregation

**User Story:** Als Benutzer möchte ich sehen, wie Teilchen zu größeren Strukturen verklumpen, damit ich Aggregationsprozesse studieren kann.

#### Akzeptanzkriterien

1. WENN zwei Teilchen sich berühren, DANN SOLL das System sie zu einem Konglomerat verbinden
2. WENN Teilchen zu einem Konglomerat verbinden, DANN SOLL das System die individuellen Teilchen als visuell separate Elemente beibehalten, die jedoch einen unveränderlichen zusammenhabng bilden
3. WENN ein Konglomerat entsteht, DANN SOLL das System die Gesamtmasse als Summe der Einzelmassen berechnen
4. WENN ein Konglomerat entsteht, DANN SOLL das System die Bewegung aus den Bewegungsvektoren der beteiligten Teilchen berechnen
5. WENN ein Konglomerat eine Rotation aufweist, DANN SOLL das System den Drehimpuls berechnen und darstellen
6. DAS System SOLL standardmäßig vollständig inelastische Kollisionen (Elastizität = 0) verwenden

### Anforderung 8: Erweiterbarkeit auf 3D

**User Story:** Als Entwickler möchte ich die Simulation später auf 3D erweitern können, damit zusätzliche Raumdimensionen unterstützt werden.

#### Akzeptanzkriterien

1. DAS System SOLL eine Architektur verwenden, die dimensionsunabhängige Berechnungen ermöglicht
2. WENN physikalische Berechnungen durchgeführt werden, DANN SOLL das System Vektoroperationen verwenden, die auf 3D erweiterbar sind
3. DAS System SOLL Rendering-Logik von Physik-Logik trennen

### Anforderung 9: Drehimpulsdarstellung

**User Story:** Als Benutzer möchte ich die Rotation von Konglomeraten sehen, damit ich die Dynamik der Aggregation verstehen kann.

#### Akzeptanzkriterien

1. WENN ein Konglomerat einen Drehimpuls hat, DANN SOLL das System die Rotation visuell darstellen
2. WENN ein Konglomerat rotiert, DANN SOLL das System die Drehimpulserhaltung bei weiteren Kollisionen berücksichtigen

### Anforderung 10: Simulationssteuerung

**User Story:** Als Benutzer möchte ich die Simulation steuern und navigieren, damit ich interessante Bereiche untersuchen kann.

#### Akzeptanzkriterien

1. DAS System SOLL eine Pause-Funktion bereitstellen
2. DAS System SOLL eine Play-Funktion bereitstellen
3. DAS System SOLL eine Reset-Funktion bereitstellen
4. DAS System SOLL eine Zoom-Funktion bereitstellen
5. DAS System SOLL eine Pan-Funktion (Verschieben der Ansicht) bereitstellen
6. DAS System SOLL eine GUI zur Steuerung der Simulationsgeschwindigkeit bereitstellen
7. WENN die Simulationsgeschwindigkeit geändert wird, DANN SOLL das System die Zeitschritte entsprechend anpassen
