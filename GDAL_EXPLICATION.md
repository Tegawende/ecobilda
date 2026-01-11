# GDAL/PostGIS - Explication et choix

## C'est quoi GDAL?

**GDAL (Geospatial Data Abstraction Library)** est une bibliothèque pour manipuler des données géospatiales (cartes, coordonnées GPS, etc.).

**PostGIS** est une extension PostgreSQL qui utilise GDAL pour faire des requêtes géographiques avancées.

---

## Qu'est-ce que ça permet?

### Avec PostGIS (nécessite GDAL):

✅ **Recherche par distance**:
```python
# "Trouve tous les projets dans un rayon de 50km"
Project.objects.filter(
    location__distance_lte=(user_location, D(km=50))
)
```

✅ **Recherche par zone géographique**:
```python
# "Projets dans cette région polygonale"
Project.objects.filter(location__within=region_polygon)
```

✅ **Calculs géométriques**:
- Distance exacte entre 2 points
- Aire d'une zone
- Intersections de zones
- Points dans un rayon

✅ **Indexation spatiale ultra-rapide**:
- Requêtes géo sur millions de points en millisecondes
- Index GiST (Generalized Search Tree)

---

## Sans PostGIS (notre setup actuel)

### Ce qui fonctionne toujours:

✅ **Stockage latitude/longitude**:
```python
class Address(models.Model):
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
```

✅ **Affichage sur carte Mapbox**:
```typescript
// Frontend React
projects.forEach(project => {
  new mapboxgl.Marker()
    .setLngLat([project.longitude, project.latitude])
    .addTo(map);
});
```

✅ **Géocodage (adresse → coordonnées)**:
```python
# Via API Google Geocoding ou Mapbox
address = "12 rue de la Paix, Paris"
response = requests.get(f'https://api.mapbox.com/geocoding/v5/mapbox.places/{address}.json')
coords = response.json()['features'][0]['geometry']['coordinates']
```

✅ **Filtrage par pays/ville** (texte):
```python
projects = Project.objects.filter(address__country__code='FR')
```

### Ce qui ne fonctionne PAS sans PostGIS:

❌ **Recherche par distance**:
```python
# IMPOSSIBLE sans PostGIS
projects_nearby = Project.objects.filter(
    location__distance_lte=(user_location, D(km=50))
)
```

Mais tu peux le faire côté **frontend avec Mapbox**:
```typescript
// Calcul distance JavaScript
function getDistance(lat1, lon1, lat2, lon2) {
  // Formule Haversine
  const R = 6371; // Rayon Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance en km
}

// Filtrer projets < 50km
const projectsNearby = projects.filter(p =>
  getDistance(userLat, userLon, p.latitude, p.longitude) < 50
);
```

---

## Pour Ecobilda: On peut s'en passer?

### OUI pour le MVP! Voici pourquoi:

#### Dans l'ancienne version ASP.NET:

Les coordonnées servaient **uniquement à afficher les markers sur la carte**.

**Fichier source**: `Controllers\HostController.cs` lignes 233-244
```csharp
// ASP.NET ancien code
var mapData = hosts.Select(h => new {
    lat = h.Address.Latitude,
    lng = h.Address.Longitude,
    title = h.ProjectTitle,
    image = h.Pictures.FirstOrDefault()
}).ToList();
```

Aucune recherche par distance n'était implémentée!

#### Fonctionnalités géo actuelles dans Ecobilda:

1. ✅ Afficher projets sur carte (markers)
2. ✅ Filtrer par pays (texte)
3. ✅ Géocoder adresse → coordonnées (via API)
4. ❌ Pas de "projets près de moi" (n'existait pas avant)

**Conclusion**: PostGIS n'est pas nécessaire pour reproduire l'ancien système.

---

## Quand réactiver PostGIS?

### Features futures qui en auraient besoin:

1. **"Projets près de moi"**:
   - Slider "Rayon 10-100km"
   - Tri par distance

2. **"Projets sur ma route"**:
   - Tracé d'itinéraire
   - Projets dans zone de 50km autour du trajet

3. **Clustering intelligent**:
   - Grouper markers proches sur la carte
   - "12 projets dans cette zone"

4. **Statistiques géo**:
   - "Nombre de projets par région"
   - Heatmap de densité

### Comment réactiver (production):

1. **Installer GDAL sur le serveur**:
```bash
# Ubuntu/Debian
apt-get install gdal-bin libgdal-dev

# Docker
FROM python:3.11
RUN apt-get update && apt-get install -y gdal-bin libgdal-dev
```

2. **Modifier settings.py**:
```python
# base.py ligne 25
'django.contrib.gis',  # Re-enabled

# base.py ligne 97
'ENGINE': 'django.contrib.gis.db.backends.postgis',
```

3. **Migrer modèles** (si tu veux utiliser PointField):
```python
from django.contrib.gis.db import models as gis_models

class Address(models.Model):
    # Option 1: Garder DecimalField (compatible sans PostGIS)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)

    # Option 2: Utiliser PointField (nécessite PostGIS)
    location = gis_models.PointField(geography=True, null=True)
```

4. **Utiliser queries spatiales**:
```python
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import D

user_location = Point(2.3522, 48.8566, srid=4326)  # Paris
nearby = Project.objects.filter(
    address__location__distance_lte=(user_location, D(km=50))
).order_by('address__location')
```

---

## Récapitulatif

| Feature | Sans PostGIS | Avec PostGIS |
|---------|--------------|--------------|
| Stocker coordonnées | ✅ DecimalField | ✅ PointField |
| Afficher carte | ✅ Mapbox | ✅ Mapbox |
| Géocoder adresse | ✅ API externe | ✅ API externe |
| Filtrer par pays | ✅ CharField | ✅ CharField |
| Recherche distance | ❌ (ou JS frontend) | ✅ SQL backend |
| Tri par distance | ❌ | ✅ |
| Zones polygonales | ❌ | ✅ |
| Performance (millions pts) | ⚠️ Lent | ✅ Très rapide |

---

## Recommandation

### Pour le MVP (6-12 mois):
- ✅ **Rester sans PostGIS**
- ✅ Stocker lat/lng en DecimalField
- ✅ Afficher sur carte Mapbox
- ✅ Filtrer par pays/ville (texte)
- ✅ Calculs distance en JavaScript si besoin

### Pour la V2 (après feedback utilisateurs):
- Si les users demandent "projets près de moi" → Activer PostGIS
- Si <1000 projets → Calculs distance en JS suffisent
- Si >10000 projets → PostGIS devient utile pour performance

---

## Conclusion

**GDAL/PostGIS n'est PAS nécessaire pour Ecobilda MVP.**

Les coordonnées servent juste à afficher les projets sur la carte, exactement comme l'ancienne version ASP.NET. On peut tout faire sans PostGIS pour l'instant.

Si dans 6 mois les utilisateurs demandent "montre-moi les projets à moins de 50km", on pourra facilement réactiver PostGIS à ce moment-là. 🚀
