// Constants
var MARGIN_LEFT = 0.35;
var MARGIN_TOP = 0.35;
var MAX_PAGE_BOTTOM = 11.0 - MARGIN_LEFT;
var MAX_PAGE_RIGHT = 8.5 - MARGIN_TOP;
var CARD_WIDTH = 2.49;
var CARD_TEXT_HEIGHT = 0.25;
var UNDERLYING_CARD_INDENT = 1.0;

var CARD_SIDE = "side";
var CARD_TYPE_FIELD = "type";
var TITLE_FIELD = "title";
var SLIP_URL_FIELD = "printableSlipUrl";
var SLIP_TYPE_FIELD = "printableSlipType";
var SLIP_TYPE_ERRATA = "ERRATA";

var IS_LOCAL_DEVELOPMENT = false; // Don't ever check this in as true!


// Spacing
var spacingOptions = {
  horizontalSpacing: 0,
  verticalSpacing: 0,
  horizontalSpacingInches: 0,
  verticalSpacingInches: 0
};

// Lists and Maps
var allPrintableCards = []; // List of ALL full Card objects which can be printed
var cardGuidsForPdf = []; // List of card GUIDs which will go on the PDF

// Names for every card in the system (for matching purposes)
var allCardNames  = [];

// Every JSON Card
var allJsonCards = [];

// Every JSON card which is printable (Virtual / Errata)
var allPrintableCards = [];

// Mapping of GUID -> JSON Card for quick lookups
var guidToCardMap = {};

// Map of [StrippedPrintableCardName, -> "Underlying actual Card Name"]
var cardTitleToUnderlyingCardTitleMap = {}; 

// Map of GEMP ID -> JSON Card object
var gempIdToCardMap = {};


// Bindable checkboxes in the UI
var includeUnderlyingCardList = false;
var includeOutsideOfDeckCards = false;

console.log("Vkit Verison 1.5");

function popuplateSpacingFields() {
  document.getElementById("inputHorizontalSpacing").value = spacingOptions.horizontalSpacing;
  document.getElementById("inputVerticalSpacing").value = spacingOptions.verticalSpacing;
}

function getNewSpacingOptions() {
  // First, get the new spacing options (if they exist)
  var horizontalSpacing = document.getElementById("inputHorizontalSpacing").value;
  var verticalSpacing = document.getElementById("inputVerticalSpacing").value;

  var parsedHorizontal = parseInt(horizontalSpacing);
  var parsedVertical = parseInt(verticalSpacing);

  if (isNaN(parsedHorizontal) || isNaN(parsedVertical)) {
    alert("The spacing fields contains a invalid value. Please make sure to use whole numbers (0, 1, 2, etc)");
    return false;
  }

  spacingOptions.horizontalSpacing = parsedHorizontal;
  spacingOptions.verticalSpacing = parsedVertical;
  spacingOptions.horizontalSpacingInches = parsedHorizontal / 200;
  spacingOptions.verticalSpacingInches = parsedVertical / 200;

  return true;
}

function showPrintProgress() {
  jQuery('#printProgressObj').css('display', 'block');
}

function hidePrintProgress() {
  jQuery('#printProgressObj').css('display', 'none');
}

function expandCollapseSpacingOptions() {
  var displayMode = jQuery('#printOptionsObj').css('display');
  if (displayMode == "none") {
      jQuery('#printOptionsObj').css('display', 'block');
  } else {
      jQuery('#printOptionsObj').css('display', 'none');
  }
}

function expandCollapseInstructions() {
    var displayMode = jQuery('#instructionsObj').css('display');
    if (displayMode == "none") {
        jQuery('#instructionsObj').css('display', 'block');
    } else {
        jQuery('#instructionsObj').css('display', 'none');
    }
}

function getFilterText() {
  var textObj = jQuery('#filterText');
  return textObj.val();
}


// Handle a change in the Filter, re-generating a list of 'matchingCards'
function updateMatchingCards() {
    var i = 0;

    var filterText = getFilterText();
    console.log("Filter Change!: " + filterText);


    var matchingCardGuids = [];
    for (i = 0; i < allPrintableCards.length; i++) {
        var matches = false;

        var lowercaseFilterText = filterText.toLowerCase();

        if ("" === lowercaseFilterText) {
            matches = true;
        } else if (-1 != allPrintableCards[i].fullName.toLowerCase().indexOf(lowercaseFilterText)) {
            matches = true;
        }

        if (matches) {
          matchingCardGuids.push(allPrintableCards[i].guid);
        }
    }

    jQuery('#selectAdds').find('option')
      .remove();


    // TODO:
    // 1. Put Card IDs into the list instead of card names
    // 2. Distinguish between Light and Dark sides of cards. EX: Sandcrawler (Dark) (Errata)
    // 3. Add "(Errata)" label for erratas

    // Ideas:
    // 1. On load, iterate through all cards looking for Dups. If Dups found, then add Light/Dark
    // 2. Include "(Errata)" in fullName (change to 'displayName')
    // 3. The same place that we strip out " (WB)", also strip out (Dark), (Light), and (Errata)


    for (i = 0; i < matchingCardGuids.length; i++) {
        var matchingCardGuid = matchingCardGuids[i];
        console.log("Add card: " + matchingCardGuid);
        jQuery('#selectAdds').append('<option value="' + matchingCardGuid + '">' + cardTitleForGuid(matchingCardGuid) + '</option>');
    }

    // Automatically select the first card in the search results
    var matchingCards = jQuery('#selectAdds > option:eq(0)');
    if (matchingCards && matchingCards.length > 0) {
      jQuery('#selectAdds > option:eq(0)').prop('selected', true)
    }
}


function isWhiteBorderGuid(guid) {
  return (-1 != guid.indexOf(" (WB"));
}

function cardFromGuid(guid) {
  if (guidToCardMap[guid]) {
    return guidToCardMap[guid];
  } else if (isWhiteBorderGuid(guid)) {
    var normalCardGuid = guid.replace(" (WB)", "");
    return cardFromGuid(normalCardGuid);
  }

  console.log("Error looking up card for guid: " + guid);
  return null;
}

function cardTitleForGuid(guid) {
  return cardFromGuid(guid).fullName;
}

function queueFilterChange() {
    setTimeout(filterChanged, 250);
}

function filterChanged() {
    updateMatchingCards();
}

function addSelectedCards(isWhiteBorder) {

  // Try to add the cards next to it's duplicates (if exist)
  jQuery("#selectAdds").find(":selected").each(function() {
      var cardGuidToAdd = jQuery(this).val();

      // TODO: Fix Whiteborder implementation
      if (isWhiteBorder) {
          cardGuidToAdd += " (WB)";
      }

      var inserted = false;
      for (var j = 0; j < cardGuidsForPdf.length; j++) {
          if (cardGuidsForPdf[j] == cardGuidToAdd) {
              cardGuidsForPdf.splice(j, 0, cardGuidToAdd);
              inserted = true;
              break;
          }
      }

      if (!inserted) {
          cardGuidsForPdf.push(cardGuidToAdd);
      }

      redrawSelectedCards();

      // Selected the last card that we added
      var indexToSelect = j;
      if (!inserted) {
        indexToSelect = cardGuidsForPdf.length - 1;
      }
      jQuery('#selectedRemoves > option').eq(indexToSelect).prop('selected', true);
      
  });

}

function redrawSelectedCards() {
  jQuery('#selectedRemoves').find('option')
        .remove();

  for (var i = 0; i < cardGuidsForPdf.length; i++) {
      var cardGuid = cardGuidsForPdf[i];
      console.log("Add card: " + cardGuid);
      jQuery('#selectedRemoves').append('<option value="' + cardGuid + '">' + cardTitleForGuid(cardGuid) + '</option>');
  }
}

function removeSelectedCards() {
    jQuery("#selectedRemoves").find(":selected").each(function() {
        var cardToRemove = jQuery(this).val();
        for (var j = 0; j < cardGuidsForPdf.length; j++) {
            if (cardGuidsForPdf[j] == cardToRemove) {
                jQuery(this).remove();
                cardGuidsForPdf.splice(j, 1);
                break;
            }
        }
    });
}

function toggleUnderlyingCardList() {
  includeUnderlyingCardList = jQuery('#includeUnderlyingCardListCheck').is(":checked")
}


function convertImgToBase64(isWhiteBorder, url, canvas, img, callback) {

  img.crossOrigin = "Anonymous";
  img.src = url;
  img.onload = function() {
    canvas.height = img.height;
    canvas.width = img.width;
    var context = canvas.getContext('2d');

    context.drawImage(img, 0, 0);

    if (isWhiteBorder) {
        convertCanvasToWhiteBorder2(canvas);
    }

    var dataURL = canvas.toDataURL('image/png');
    var aspectRatio = canvas.height / canvas.width;
    callback(dataURL, aspectRatio);
  };
  img.onerror = function() {
      console.log("Failed ot open image: " + url);
      callback(null);
  };

}

function sortCards(originalList, fullTemplates, halfSlips) {
  for (var i = 0; i < originalList.length; i++) {
      var card = originalList[i];
      if (card.aspectRatio > 1) {
          // Card is taller than wide
          fullTemplates.push(card);
      } else {
          halfSlips.push(card);
      }
  }
}

function isCardListEnabled() {
  return true;
}

function setPrintPoint(pointObj, top, left, bottom, right) {
  pointObj.top = top;
  pointObj.left = left;
  pointObj.bottom = bottom;
  pointObj.right = right;
}


// Add a list of underlying cards to the last page of the PDF
function printCardNames(doc, cardNames, lastPrintPoint) {

  if (!isCardListEnabled()) {
    return;
  }

  doc.addPage();
  lastPrintPoint.top = 1;
  doc.setFontSize(16);
  doc.text("Underlying Card List:", 1, lastPrintPoint.top);
  lastPrintPoint.top += CARD_TEXT_HEIGHT * 1.5;

  doc.setFontSize(12);
  var cardNumber = 0;
  cardNames.forEach(function(cardName) {
    cardNumber++;
    
    if (lastPrintPoint.top + CARD_TEXT_HEIGHT > MAX_PAGE_BOTTOM) {
      doc.addPage();
      lastPrintPoint.top = 0;
    }

    doc.text(cardName, UNDERLYING_CARD_INDENT, lastPrintPoint.top);
    lastPrintPoint.top += CARD_TEXT_HEIGHT;
  });
  
}

// Given a list of card NAMEs, add those actual cards to the PDF
function printCards(doc, cardsToPrint, lastPrintPoint) {

  for (var i = 0; i < cardsToPrint.length; i++) {
      var card = cardsToPrint[i];

      var calculatedHeight = CARD_WIDTH * card.aspectRatio;
      //console.log("calculatedHeight: " + calculatedHeight);

      var nextTop = lastPrintPoint.top;
      var nextLeft = lastPrintPoint.right;
      var addedPageOrRow = false;

      // If this card exceeds the bottom, add a new page
      if ((nextTop + calculatedHeight) > MAX_PAGE_BOTTOM) {
          // Won't fit on page!  Add a new page!
          //console.log("Next bottom would have been off-page. Figuring out to adapt!");
          doc.addPage();
          addedPageOrRow = true;
          nextTop = MARGIN_TOP;
          nextLeft = MARGIN_LEFT;
      }

      // If this card will exceed the width, add a new row OR a new page if needed
      if ((nextLeft + CARD_WIDTH) > MAX_PAGE_RIGHT) {
          //console.log("Next right edge would have been off screen. Figuring out how to adapt!");
          nextTop = lastPrintPoint.bottom;
          nextTop += spacingOptions.verticalSpacingInches;

          // Need to add a new row
          if ((nextTop + calculatedHeight) < MAX_PAGE_BOTTOM) {
              // Card will fit in the page in the next rows
              //console.log("Adding new row!");
              nextTop = lastPrintPoint.bottom;
              nextTop += spacingOptions.verticalSpacingInches;
              nextLeft = MARGIN_LEFT;
              addedPageOrRow = true;
          } else {
              // Need a whole new page
              //console.log("Adding new page!");
              doc.addPage();
              nextTop = MARGIN_TOP;
              nextLeft = MARGIN_LEFT;
              addedPageOrRow = true;
          }
      } else {
          // Card will fit in this row on this page!  No adjustments needed.
      }

      if (card.dataUrl !== null) {
          doc.addImage(card.dataUrl, 'jpeg', nextLeft, nextTop, CARD_WIDTH, calculatedHeight);
      }

      // 'bottom' of last card can't be any higher than the lowest card in the current row
      var bottomOfLastPrintedCard = nextTop + calculatedHeight;
      if (!addedPageOrRow) {
          bottomOfLastPrintedCard = Math.max(bottomOfLastPrintedCard, lastPrintPoint.bottom);
      }
      // Adjust the print-point based on the card we just added
      setPrintPoint(lastPrintPoint, nextTop, nextLeft,
                                    bottomOfLastPrintedCard, nextLeft + CARD_WIDTH + spacingOptions.horizontalSpacingInches);

  }

}


function generatePdf() {

    if (!getNewSpacingOptions()) {
      return;
    }

    var canvas = document.createElement('canvas');
    var img = document.createElement('img');

    showPrintProgress();

    console.log("Spacing options are at: " + spacingOptions.horizontalSpacingInches  + " V: " + spacingOptions.verticalSpacingInches);

    var doc = new jspdf.jsPDF('portrait', 'in', [11, 8.5]);

    var cardsWithSizes = [];
    var underlyingCardNames = [];


    function addNextCard(currentCardIndex, shouldPrintBack) {

        var progressElement = document.getElementById("progressText");
        if (progressElement) {
          progressElement.innerHTML = "Adding card: " + currentCardIndex + " of " + cardGuidsForPdf.length;
        }

        if (currentCardIndex == cardGuidsForPdf.length) {

          var halfSlips = [];
          var fullTemplates = [];
          sortCards(cardsWithSizes, fullTemplates, halfSlips);

          var lastPrintPoint = {
              left: MARGIN_LEFT,
              top: MARGIN_TOP,
              right: MARGIN_LEFT,
              bottom: MARGIN_TOP
          };
          printCards(doc, fullTemplates, lastPrintPoint);
          printCards(doc, halfSlips, lastPrintPoint);
          if (includeUnderlyingCardList) {
            printCardNames(doc, underlyingCardNames, lastPrintPoint);
          }

          doc.output('save', 'vkitPdf.pdf');

          hidePrintProgress();

          img = null;
          canvas = null;

        } else {

          var cardGuid = cardGuidsForPdf[currentCardIndex];

          var isWhiteBorder = isWhiteBorderGuid(cardGuid);

          var actualCard = cardFromGuid(cardGuid);

          var cardPath = actualCard.front[SLIP_URL_FIELD];
          if (shouldPrintBack && actualCard.back && actualCard.back[SLIP_URL_FIELD]) {
            cardPath = actualCard.back[SLIP_URL_FIELD];
          }

          console.log("image: " + cardPath );

          var underlyingCardTitle = getUnderlyingCardTitleForCard(actualCard);
          if (underlyingCardTitle) {
            underlyingCardNames.push(underlyingCardTitle);
          } else {
            console.error("Couldn't find underlying card for: " + getCardTitle(actualCard));
          }


          var printBackNext = false;
          if (!shouldPrintBack && actualCard.back && actualCard.back[SLIP_URL_FIELD]) {
            printBackNext = true;
          }

          // Async function to keep adding new cards until finished
          convertImgToBase64(isWhiteBorder, cardPath, canvas, img, function(dataUrl, aspectRatio) {

              cardsWithSizes.push( {
                cardPath: cardPath,
                dataUrl: dataUrl,
                aspectRatio: aspectRatio
              });

              if (printBackNext) {
                // Print it a second time, but this time with the back
                addNextCard(currentCardIndex, true);
              } else {
                addNextCard(currentCardIndex + 1);
              }

          });
        }
    }

    addNextCard(0);
}


setTimeout(setupKeyListener, 1000);

function moveSelectionDown() {
  // User hit the down arrow while in the input box. 
  // Just shift focus to the "selected cards" field so the user can navigate
  jQuery('#selectAdds').focus()
}

function setupKeyListener() {

  jQuery(jQuery("#filterText").get()).keydown(function(evt){
    if (evt.which === 40) {
      // Down Key
      moveSelectionDown();
    }
  });

  jQuery(jQuery("body").get()).keydown(function(evt){
    if (evt.which === 13) {
      // Enter key pressed. Add the selected card
      addSelectedCards(false);
    }
  });

  jQuery(jQuery("#selectedRemoves").get()).keydown(function(evt){
    if (evt.keyCode === 46 || evt.keyCode === 8) {
      // Delete Key
      removeSelectedCards();
    }
  });

}


/*
 * File Uploading
 */
function loadEventFromFile() {
  var input, file, fr;

  if (typeof window.FileReader !== 'function') {
    alert("The file API isn't supported on this browser yet.");
    return;
  }

  input = jQuery('#fileinput').get(0);
  input.onchange = function() {
    if (!input) {
      alert("Um, couldn't find the fileinput element.");
    }
    else if (!input.files) {
      alert("This browser doesn't seem to support the `files` property of file inputs.");
    }
    else if (!input.files[0]) {
      alert("Please select a file before clicking 'Load'");
    }
    else {
      file = input.files[0];
      fr = new FileReader();
      fr.onload = receivedText;
      fr.readAsText(file);
    }

    function receivedText(e) {
      var lines = e.target.result;
      loadCardsFromFile(lines);
      input.onchange = function() {};
      jQuery(input).val(null);
    }
  }
  input.click();
}


function loadCardsFromFile(fileContents) {
  if (fileContents.indexOf("<?xml ") != -1) {
    loadCardFromGempExport(fileContents);
  } else {
    alert("Gemp plaintext lists not supported yet. Please use GEMP Deck Export files for now")
  }
}


function loadCardFromGempExport(fileContents) {

  var includeShields = confirm("Include shields and other cards from outside of deck?\n\n (Cancel = No)");

  // Kill all lines which start with "<cardOutsideDeck"
  if (!includeShields) {
    fileContents = fileContents.replace(/cardOutsideDeck.*>/g, '');
  }

  addCardsByGempIds(fileContents);
}

function addCardsByGempIds(fileContents) {

  const regexp = /blueprintId="([a-zA-Z 0-9_]*)"/g;

  const matches = [...fileContents.matchAll(regexp)];
  const gempIds = matches.map(match => match[1]);

  gempIds.forEach(function(gempId) {

    var matchingCard = gempIdToCardMap[gempId];
    if (matchingCard) {
      cardGuidsForPdf.push(matchingCard.guid);
    }
    
  });

  redrawSelectedCards();
}


function addCardsByNames(fileContents) {

  const regexp = /title="([a-zA-Z 0-9,.:'&\\\/\"\-]*)"/g;

  const matches = [...fileContents.matchAll(regexp)];
  const cardNames = matches.map(match => match[1]);

  const strippedCardNames = cardNames.map(cardName => cardName.replace(/[^a-zA-Z0-9]/g, ''));
  var strippedActualCards = allCardNames.map(actualCard => actualCard.replace(/[^a-zA-Z0-9]/g, ''));

  // Try to find all the stripped cards in the list of normal cards
  strippedCardNames.forEach(card => {

    var bestMatchIndex = -1;
    var bestMatchSimilarity = 0.5;

    for (var i = 0; i < strippedActualCards.length; i++) {
      var matchPercent = similarity(card, strippedActualCards[i]);
      if (matchPercent > bestMatchSimilarity) {
        bestMatchIndex = i;
        bestMatchSimilarity = matchPercent;
      }
    }

    if (bestMatchIndex != -1 && bestMatchSimilarity > 0.8) {
      cardGuidsForPdf.push(allCardNames[bestMatchIndex]);
    }

  });

  redrawSelectedCards();
}

function stripTitleToBasics(cardName) {
  var strippedName = cardName.replace(/[^a-zA-Z0-9]/g, '');
  return strippedName;
}


/*
 *  Calculation of Levenshtein Distance:
 * https://en.wikipedia.org/wiki/Levenshtein_distance
 */

function similarity(s1, s2) {
  var longer = s1;
  var shorter = s2;
  if (s1.length < s2.length) {
    longer = s2;
    shorter = s1;
  }
  var longerLength = longer.length;
  if (longerLength == 0) {
    return 1.0;
  }
  return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}

function editDistance(s1, s2) {
  s1 = s1.toLowerCase();
  s2 = s2.toLowerCase();

  var costs = new Array();
  for (var i = 0; i <= s1.length; i++) {
    var lastValue = i;
    for (var j = 0; j <= s2.length; j++) {
      if (i == 0)
        costs[j] = j;
      else {
        if (j > 0) {
          var newValue = costs[j - 1];
          if (s1.charAt(i - 1) != s2.charAt(j - 1))
            newValue = Math.min(Math.min(newValue, lastValue),
              costs[j]) + 1;
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
    }
    if (i > 0)
      costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}


// Initial startup of the app - Loads all data and populates all arrays and maps
function startup() {

  var lightCardListUrl = 'https://scomp.starwarsccg.org/Light.json';
  var darkCardListUrl = 'https://scomp.starwarsccg.org/Dark.json';
  if (IS_LOCAL_DEVELOPMENT) {
    lightCardListUrl = './Light.json'; // Read from local file
    darkCardListUrl = './Dark.json'; // Read from local file
  }

  jQuery.getJSON(lightCardListUrl, function(light) {  
    jQuery.getJSON(darkCardListUrl, function(dark) {

      light.cards.forEach(function(card) {
        allJsonCards.push(card);
      });

      dark.cards.forEach(function(card) {
        allJsonCards.push(card);
      });

      if (IS_LOCAL_DEVELOPMENT) {
        useLocalImagePaths(allJsonCards);
      }
      
      allJsonCards.forEach(function(card) {

        card.guid = generateGUID();
        addCardIfPrintable(card);

        if (card.underlyingCardFor && card.underlyingCardFor.length > 0) {
          card.underlyingCardFor.forEach(function(underlyingFor) {
            // transitioning from a list of strings to a list of objects with a title field containing 
            // the string - this will account for that difference in underlying data, can be removed
            // once the json data is fully converted
            var underlyingForName = underlyingFor;
            if (underlyingFor.hasOwnProperty('title')) {
              underlyingForName = underlyingForName.title;
            }

            addUnderlyingCardMapping(underlyingForName, getCardTitle(card));
          });
        }
      });

      enhanceCardNames();

      popuplateSpacingFields();

      filterChanged();
    });

  });
}


// Append special suffixes to cards to avoid duplicates (Light), (ERRATA), ect
function enhanceCardNames() {

  // Add " (Errata)" for all non-virtual Erratas
  allPrintableCards.forEach(function(card) {
    if (isCardNonVirtualErrata(card)) {
      card.fullName += " (Errata)";
    }
  });

  allPrintableCards.forEach(function(card) {
    // See if we have another card with the same name. If so, append the side of the force
    var foundMatch = false;
    var sameNameAndCardType = false;
    for (var i = 0; i < allPrintableCards.length; i++) {
      var otherCard = allPrintableCards[i];

      if ((card != otherCard) && getCardTitle(card) == getCardTitle(otherCard)) {
        foundMatch = true;
        if (getCardType(card) == getCardType(otherCard)) {
          sameNameAndCardType = true;
        }
        break;
      }
    }

    if (foundMatch) {
      if (!sameNameAndCardType) {
        card.fullName += " (" + getCardType(card) + ")";  // "A Trajedy Has Occurred (Defensive Shield)"
      } else {
        card.fullName += " (" + getCardSide(card) + ")";  // "Alter (Dark)"
      }
    }
    
  });
  
}


jQuery(document).ready(function() {

  console.log("After Loaded");
  startup();
  console.log("Startup Complete");
  
});


// ------ JSON Card Field access ------
// These should all be member functions of the JSON card data
// but until we get to that point, these will suffice

function addCardIfPrintable(card) {
  card.fullName = buildCardName(card);

  if (isPrintable(card)) {
    allPrintableCards.push(card);
    guidToCardMap[card.guid] = card;
    gempIdToCardMap[card.gempId] = card;
  }
}

function isPrintable(card) {
  return getFrontSlipUrl(card) || getBackSlipUrl(card);
}

function isCardNonVirtualErrata(card) {
  return getSlipType(card) == SLIP_TYPE_ERRATA;
}

function buildCardName(card) {
  var fullName = getCardTitle(card);
  return fullName;
}


function getUnderlyingCardTitleForCard(card) {
  var cardTitle = stripTitleToBasics(getCardTitle(card));
  return cardTitleToUnderlyingCardTitleMap[cardTitle];
}

function addUnderlyingCardMapping(printableCardName, underlyingCardTitle) {
  printableCardName = stripTitleToBasics(printableCardName);
  cardTitleToUnderlyingCardTitleMap[printableCardName] = underlyingCardTitle;
}

function getCardTitle(card) {
  return card.front[TITLE_FIELD];
}

function getCardType(card) {
  return card.front[CARD_TYPE_FIELD];
}

function getCardSide(card) {
  return card[CARD_SIDE];
}

function getFrontSlipUrl(card) {
  return card.front[SLIP_URL_FIELD];
}

function getBackSlipUrl(card) {
  return card.back ? card.back[SLIP_URL_FIELD] : null;
}

function getSlipType(card) {
  var slipType = card.front[SLIP_TYPE_FIELD];
  if (!slipType && card.back) {
    slipType = card.back[SLIP_TYPE_FIELD];
  }
  return slipType;
}


// ---- Generic Utilities
function generateGUID() {
  // http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
  /*jshint bitwise: false*/
  return   'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
  });
};


// ---- Special Utilities for Local Development
// Can't load  images from the web due to CORS limitations. 
// So instead, rely on having a copy of that data on your local dev machine
// These utilities transform the URLs to use './' instead of res.starwarsccg.org/vkit/



function useLocalImagePaths(jsonCards) {
  jsonCards.forEach(function(card) {
    useLocalImagePathsForSide(card.front);
    useLocalImagePathsForSide(card.back);
  })
}

function useLocalImagePathsForSide(cardSide) {
  if (cardSide && cardSide[SLIP_URL_FIELD]) {
    cardSide[SLIP_URL_FIELD] = cardSide[SLIP_URL_FIELD].replace("https://res.starwarsccg.org/vkit/", "./");
  }
}