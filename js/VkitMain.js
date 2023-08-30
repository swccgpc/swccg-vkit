var MARGIN_LEFT = 0.35;
var MARGIN_TOP = 0.35;

var MAX_PAGE_BOTTOM = 11.0 - MARGIN_LEFT;
var MAX_PAGE_RIGHT = 8.5 - MARGIN_TOP;

var CARD_WIDTH = 2.49;

var spacingOptions = {
  horizontalSpacing: 0,
  verticalSpacing: 0,
  horizontalSpacingInches: 0,
  verticalSpacingInches: 0
};

var allPrintableJsonCards = []; // List of ALL full Card objects which can be printed
var matchingCardNames = [];  // List of card NAMES matching the filter
var cardsForPdf = []; // List of card NAMES which will go on the PDF

var printedCards = [];
var includeUnderlyingCardList = false;

console.log("Vkit Verison 1.3");

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


    matchingCardNames.length = 0;
    for (i = 0; i < allPrintableJsonCards.length; i++) {
        var matches = false;

        var lowercaseFilterText = filterText.toLowerCase();

        if ("" === lowercaseFilterText) {
            matches = true;
        } else if (-1 != allPrintableJsonCards[i].fullName.toLowerCase().indexOf(lowercaseFilterText)) {
            matches = true;
        }

        if (matches) {
            matchingCardNames.push(allPrintableJsonCards[i].fullName);
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


    for (i = 0; i < matchingCardNames.length; i++) {
        var matchingName = matchingCardNames[i];
        console.log("Add card: " + matchingName);
        jQuery('#selectAdds').append('<option value="' + matchingName + '">' + matchingName + '</option>');
    }

    // Automatically select the first card in the search results
    if (matchingCardNames.length > 0) {
      jQuery('#selectAdds > option:eq(0)').prop('selected', true)
    }

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
      var cardToAdd = jQuery(this).val();

      if (isWhiteBorder) {
          cardToAdd += " (WB)";
      }

      var inserted = false;
      for (var j = 0; j < cardsForPdf.length; j++) {
          if (cardsForPdf[j] == cardToAdd) {
              cardsForPdf.splice(j, 0, cardToAdd);
              inserted = true;
              break;
          }
      }

      if (!inserted) {
          cardsForPdf.push(cardToAdd);
      }

      redrawSelectedCards();

      // Selected the last card that we added
      var indexToSelect = j;
      if (!inserted) {
        indexToSelect = cardsForPdf.length - 1;
      }
      jQuery('#selectedRemoves > option').eq(indexToSelect).prop('selected', true);
      
  });

}

function redrawSelectedCards() {
  jQuery('#selectedRemoves').find('option')
        .remove();

  for (var i = 0; i < cardsForPdf.length; i++) {
      var match = cardsForPdf[i];
      console.log("Add card: " + match);
      jQuery('#selectedRemoves').append('<option value="' + match + '">' + match + '</option>');
  }
}

function removeSelectedCards() {
    jQuery("#selectedRemoves").find(":selected").each(function() {
        var cardToRemove = jQuery(this).val();
        for (var j = 0; j < cardsForPdf.length; j++) {
            if (cardsForPdf[j] == cardToRemove) {
                jQuery(this).remove();
                cardsForPdf.splice(j, 1);
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

var CARD_TEXT_HEIGHT = 0.25;
var UNDERLYING_CARD_INDENT = 1.0;


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

    function addNextCard(currentCardIndex) {

        var progressElement = document.getElementById("progressText");
        if (progressElement) {
          progressElement.innerHTML = "Adding card: " + currentCardIndex + " of " + cardsForPdf.length;
        }

        if (currentCardIndex == cardsForPdf.length) {

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

          var cardName = cardsForPdf[currentCardIndex];
          var isWhiteBorder = (-1 != cardName.indexOf(" (WB)"));

          var cardPaths = [];
          var actualCard = findCardWithName(cardName);
          if (actualCard.front.printableSlipUrl) {
            cardPaths.push(actualCard.front.printableSlipUrl);
          }
          if (actualCard.back && actualCard.back.printableSlipUrl) {
            cardPaths.push(actualCard.back.printableSlipUrl);
          }

          // Add all cards for this card
          cardPaths.forEach(function(cardPath) {
            console.log("image: " + cardPath );

            if (cardToUnderlyingMap[actualCard.fullName]) {
              underlyingCardNames.push(cardToUnderlyingMap[actualCard.fullName]);
            }

            // Async function to keep adding new cards until finished
            convertImgToBase64(isWhiteBorder, cardPath, canvas, img, function(dataUrl, aspectRatio) {

                cardsWithSizes.push( {
                  cardPath: cardPath,
                  dataUrl: dataUrl,
                  aspectRatio: aspectRatio
                });

                addNextCard(currentCardIndex+1);
            });
          });
        }
    }

    addNextCard(0);
}

function findCardWithName(name) {
  name = name.replace(" (WB)", "")
  for (var i = 0; i < allPrintableJsonCards.length; i++) {
    var card = allPrintableJsonCards[i];
    if (card.fullName == name) {
      return card;
    }
  }
  console.log("Couldn't find printable card!! Name: " + name);
  return null;
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
      loadCards(lines);
      input.onchange = function() {};
      jQuery(input).val(null);
    }
  }
  input.click();
}

function loadCards(fileContents) {
  if (fileContents.indexOf("<?xml ") != -1) {
    loadCardFromGempExport(fileContents);
  } else {
    alert("Gemp plaintext lists not supported yet. Please use GEMP Deck Export files for now")
  }
}

function loadCardFromGempExport(fileContents) {

  var includeShields = confirm("Include shields and other cards from outside of deck?");

  // Kill all lines which start with "<cardOutsideDeck"
  if (!includeShields) {
    fileContents = fileContents.replace(/cardOutsideDeck.*>/g, '');
  }

  const regexp = /title="([a-zA-Z 0-9,.:'&\\\/\"\-]*)"/g;

  const matches = [...fileContents.matchAll(regexp)];
  const cardNames = matches.map(match => match[1]);

  addCardsByNames(cardNames);
}

function addCardsByNames(cardNames) {

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
      cardsForPdf.push(allCardNames[bestMatchIndex]);
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


var allCardNames  = [];
var allCardImages = [];

var allJsonCards = [];
var allPrintableJsonCards = [];
var cardGuidToCardMap = {};
var cardToUnderlyingMap = {}; // Map of ["Printable card name", -> "Underlying actual Card Name"]


jQuery(document).ready(function() {

  console.log("After Loaded");

  jQuery.getJSON('Light.json', function(light) {
  //jQuery.getJSON('https://scomp.starwarsccg.org/Light.json', function(light) {
    

    jQuery.getJSON('Dark.json', function(dark) {
    //jQuery.getJSON('https://scomp.starwarsccg.org/Dark.json', function(dark) {

      light.cards.forEach(function(card) {
        allJsonCards.push(card);
      });

      dark.cards.forEach(function(card) {
        allJsonCards.push(card);
      });

      
      allJsonCards.forEach(function(card) {

        card.guid = gener
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

            cardToUnderlyingMap[underlyingForName] = card.fullName;
          });
        }
      });

      popuplateSpacingFields();

      filterChanged();
    });

  });
});


function addCardIfPrintable(card) {
  card.fullName = buildCardName(card);
  if (card.front.printableSlipUrl || (card.back && card.back.printableSlipUrl)) {
    allPrintableJsonCards.push(card);
  }
}

function buildCardName(card) {
  var fullName = card.front.title;
  //if (card.back) {
  //  fullName += " / " + card.back.title;
  //}
  return fullName;
}
