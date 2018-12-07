# Walking through the app as a user, checking for what I assume to be "happy path" and logging expectations


## How to Modal
- On first visit, modal should appear.
  - h1 "How to Use the ATD Dockless Data Explorerer"
  - do we need to test for City of Austin Logo in the modal?
  - "Close" `<button>` in bottom right and `x` in top right should both close the modal
    - "Close" `<button>` and `x` have a hover effect that darkens the color
- On first visit, cookie should be logged to prevent modal from appearing on subsequent visits
- On any login after the first, the modal should not appear/mount

## Main screen
- Map (provided by mapboxgl, may not be tested)

- Five icons in a 3/2 block on the top left corner of window (all icon squares grey on hover)
  - `+` for zoom out
  - `-` for zoom in
  - `double arrows`

  - polygon tool (has a hover tooltip)
  - location icon that has 'Click here to begin' tooltip to the right of it
    - Clicking this button removes the 'Click here to begin tooltip' previously on the right of the icon
    - Clicking this button places a new tooltip on the map, with inner text that:
      - has text "Click any spot on the map to see where dockless trips started/ended"
      - has `x` in the top right that presumably closes the tooltip when clicked

# Sidebar on the Right of the window
  - h1 Dockless Data Explorer
  - City of Austin Logo + City of Austin Transportation Department

  - Two Dropdowns
    - Labeled Flow
      - Corresponding Select has the following options:
        - Trip Destinations
        - Trip Origins
    - Labeled Mode
      - Corresponding Select has the following options:
        - All
        - Scooter
        - Bicycle
  - Space for Legend to Appear(I think)
    - Maybe the space shouldn't appear until there is a legend to go inside of it. (CSS bug?)
  - 'More Info' `<button>`, which re-opens the "How to Use" modal at any time.
  - Italicized message at bottom that reads:
    - "This map has been produced by the City of Austin for the sole purpose of geographic reference. No warranty is made by the City of Austin regarding specific accuracy or completeness."


- Clicking a spot on the map:
  - Triggers a loading spinner in the sidebar
  - Initiates API call
  - Displays hexagon layer on top of the map(do we test this, or is this a mapboxGL thing?)
  - Removes the previous tooltip "Click any spot on the map to see where dockless trips started/ended"
  - Adds a new tooltip in the top right of the map that reads:
    "Click a hexagon to view how many trips started/ended at that location"
  - Mounts a flash message to the sidebar that reads:
    - `${numOfTrips} trips ${originated} in the selected area.`
    - Should read: `${numOfTrips} trips ${originated in/taken to} the selected area.`
      - Message should be determined by dropdown menu selection
  - Mounts a legend to the sidebar
    - Legend has five sections, determined relative to the total data for an area
  - Removes the *polygon tool*, and *location marker* icons on the top left
  - Places the *rotation* icon on the top left in a block below the *zoom*, *minus*, and *double arrow* icons

- Clicking a hexagon on the map after hexagons are generated:
  - Highlights that hexagon with a purple, which appears to be blended with the original color
  - Mounts a gray flash message to the right the first time it is generated.
    - Messsage reads: `${numOfTrips} (${percentageOfTrips}%) ended in the clicked cell.`
  - Changes the text of the gray flash message on subsequent hexagon clicks.
  - Does nothing if the hexagon clicked is the same hexagon that was previously highlighted.
  - Removes the previous tooltip "Click a hexagon to view how many trips started/ended at that location"
  - Adds a tooltip corresponding to the top left, *double arrows* icon that reads:
    - "Click & drag here to tilt the map"

- Clicking the *double arrows* tooltip:
  - has no obvious effect
  - maybe should change cursor to `grabbing` for better UX
- Clicking and dragging *double arrows* tooltip:
  - Tilts and allows rotation of the map, which exposes hexagon elevation.
  - Leaves the "Click & drag here to tilt the map" tooltip in place.
    - Should this tooltip be removed? (no obvious benefit aside from consistency with previous removal patterns.)
