Hong Kong Driving Risk Map — Phase 1 (README)

This interactive webmap presents the Phase 1 baseline risk model for Hong Kong’s road network.
It visualizes structural and historical risk factors across 33,000+ road segments, using publicly available datasets from the Hong Kong government.

The purpose of Phase 1 is to create a segment-level risk foundation that can later integrate YAS telematics, claims data, and traffic exposure to build a dynamic, multi-factor decision engine.

How to Use the Map

A layer toggle is located in the upper-right corner of the map interface.

Click the toggle to switch between multiple analytical layers.

Each layer updates instantly, allowing comparison across factors.

Available Layers

Crash Density
Crash count normalized by segment length (per meter). Used for baseline risk classification.

Severity Density
Severity-weighted crash measure (1 slight / 3 serious / 5 fatal).

Night/Twilight Crash Share
Percentage of crashes occurring in low-light conditions.

Lighting Coverage
Estimated lighting ratio based on proximity to public light posts.

Pedestrian Crossing Density
Number of pedestrian crossings intersecting each segment buffer — a strong structural predictor of both crash frequency and severity.

Slope Variability
Local elevation range around each segment (from 5 m DEM data).

Risk Class (0–5)
Composite crash-density–based classification ranging from:

0 = no crashes recorded

5 = very high/crash cluster zones

Data Sources

Hong Kong Transport Department (crash data, 2014–2019)

CSDI / OGCIO (road network, lighting infrastructure, crossings)

Hong Kong DEM (5 m resolution)

All datasets were processed in QGIS to create segment-level indicators and merged into a unified geospatial model.

Purpose of Phase 1

Phase 1 is a structural foundation, not a final weighted model.
It is designed to support Phase 2, where exposure, speed environment, conflict density, telematics, and claims will be combined into a comprehensive risk scoring engine.

Contact

For questions or collaboration:
Alex Broz — GIS & Spatial Analytics
