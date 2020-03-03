<?php
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
/* ^^ Force pages to reload every time ^^ */
/*
Plugin Name: VkitApp
Description: SWCCG VKit
Author: Tom Marlin
Version: 1.1
*/


//add_action('admin_menu', 'test_plugin_setup_menu');

add_shortcode("vkit_app", "initVkit" );

function initVkit(){

  echo '<script src="//cdnjs.cloudflare.com/ajax/libs/jspdf/1.1.135/jspdf.min.js"></script>' . "\n";
  echo '<script src="' . plugins_url('/vkit-app/js/VkitMain.js') . '"></script>' . "\n";
  echo '<script src="' . plugins_url('/vkit-app/js/whiteBorderizer.js') . '"></script>' . "\n";

  // For SWCCGPC:
  $extraPrefix = "wp/";

  // For Local testing:
  //$extraPrefix = "";

  $cardsPath = '/wp-content/plugins/vkit-app/cards/standard';
  $dir_f = ABSPATH . $cardsPath;

  $files = scandir($dir_f);

  echo "<script> var j = 0;</script>";
  echo "<script>";

  echo "var allCardNames = [];";
  echo "var allCardImages = [];";
  foreach ($files as $value) {
    if ($value != '.' && $value != '..') {
      echo "allCardNames.push('" . $value . "');";
      echo "allCardImages['" . $value . "'] = '../" . $extraPrefix . $cardsPath . "/" . $value . "/image.png';";
      echo "allCardImages['" . $value . " (WB)'] = '../" . $extraPrefix . $cardsPath . "/" . $value . "/image.png';";
    }
  }

  echo '</script>';

  echo "<!DOCTYPE html>
    <meta charset='utf-8'>

    <style type='text/css'>

    .fl-post-header {
      display: none;
    }

    .vkit-app {
      color: black;
    }

    .vkit-app ::selection {
      color: white;
    }

    .vkit-app h1,
    .vkit-app h2,
    .vkit-app h3 {
      color: black;
    }

    .row-New:before,
    .row-New:after {
      content: ' ';
      display: table;
    }

    .row-New:after {
      clear: both;
    }

    .row-New {
    }

    .col-md-5-New {
      position: relative;
      min-height: 1px;
      width: 41%;
      float:left;
    }

    .col-md-12-New {
      position: relative;
      min-height: 1px;
      width: 100%;
      float:left;
      padding-left: 1.4em;
      padding-right: 1.4em;
    }

    .col-md-2-New {
      position: relative;
      min-height: 1px;
      width: 16%;
      float:left;
      text-align: center;
    }

    .btn-New {
      display: inline-block;
      padding: 6px 12px;
      margin-bottom: 0;
      font-size: 14px;
      font-weight: 400;
      line-height: 1.42857143;
      text-align: center;
      white-space: nowrap;
      vertical-align: middle;
      -ms-touch-action: manipulation;
      touch-action: manipulation;
      cursor: pointer;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
      background-image: none;
      border: 1px solid transparent;
      border-radius: 4px;
    }

    .btn-add-remove {
      width: 85%;
    }

    .btn-info-New {
      color: #fff;
      background-color: #5bc0de;
      border-color: #46b8da;
    }

    .btn-info-New:hover {
      background-color: #5bc0de !important;
    }

    .btn-success-New {
      color: #fff;
      background-color: #5cb85c;
      border-color: #4cae4c;
    }

    </style>

    <div class='vkit-app'>

        <h2 style='float:left; font-weight:bold; font-size:22px; margin-top: 0px; text-transform: none !important;'>Vkit: Print only the cards you need</h2>

        <!-- Instructions and Spacing Options on the right side -->
        <div class='row-New' style='width:100%'>
          <div class='row-New' style='float:right; font-size: 1.2em; font-weight: bold'>
            <div style='margin-left: 10px; float:right; text-decoration:underline; font-style:italic; cursor: pointer; color: rgb(255, 167, 74); font-weight: 300;font-size: 0.9em;' onclick='expandCollapseInstructions()'>+ Click For Instructions... </div>
            <div style='clear:both'></div>
          </div>
        </div>

        <div style='clear:both'></div>

        <!-- Instructions (collapsble per above) -->
        <div id='instructionsObj' style='border:thin solid #DADADA;margin:20px; position:relative; display:none'>
            <div style='position:absolute; top: 10px; right: 10px; ; cursor: pointer'  onclick='expandCollapseInstructions()'>[Hide]</div>
            <div style='margin:20px'>
                <div> - The cards on the left are all of the cards available. </div>
                <div> - The cards on the right are all of the cards you have selected to print. </div>
                <div> - Type part of a card name into the 'filter' to limit the cards you see on the left.</div>
                <div> - Select a card on the left and press 'Add >>' to add it to the list on the right. Likewise to remove a card </div>
                <div> - Click 'Generate PDF' when you are ready. </div>
                <div style='text-decoration:underline; font-weight:bold'>The PDF may take a little while to generate. When it is ready, Your download should start automatically</div>
            </div>
        </div>


        <!-- Row: Labels -->
        <div class='row-New' style='width:100%'>
          <div class='col-md-5-New'>
              <label>Filter Cards:</label>
              <div style='clear:both'></div>
              <input type='text' id='filterText' onkeypress='queueFilterChange()' onchange='filterChanged()' style='width:100%'>
              <div style='clear:both;height:15px;width:100%'></div>
          </div>
        </div>


        <!-- Row: Actual controls -->
        <div class='row-New' style='height:100%; width:100%'>
            <div class='col-md-5-New' style='height:100%'>
                <select multiple id='selectAdds' size=20 style='width:100%;'>
                  <!--<option ng-repeat='x in matchingCards' value='{{x}}'>{{x}}</option>-->
                </select>
            </div>

            <!-- Middle Pane:  Add/Remove buttons -->
            <div class='col-md-2-New'>
                <div>
                    <button class='btn-New btn-info-New btn-block btn-add-remove' onclick='addSelectedCards(false)'>Add (BB) &gt; </button>
                    <div style='height:10px'></div>
                    <button class='btn-New btn-info-New btn-block btn-add-remove' onclick='addSelectedCards(true)'>Add (WB) &gt; </button>
                    <div style='height:10px'></div>
                    <button class='btn-New btn-info-New btn-block btn-add-remove' onclick='removeSelectedCards()'> &lt; Remove</button>
                </div>
                <!--<select multiple id='selectAdds' size=20 style='width:1px; visibility:hidden'></select>-->

            </div>
            <div style='clear:right'></div>

            <!-- Right Pane:  Added Cards -->
            <div class='col-md-5-New'>
                <select multiple id='selectedRemoves' size=20 style='width:100%;height:100%'>
                  <!--<option ng-repeat='x in cardsForPdf track by $index' value='{{x}}'>{{x}}</option>-->
                </select>
            </div>
        </div>


        <!-- Print Options (collapsble per above) -->
        <div id='printOptionsObj' style='border:thin solid #DADADA; margin-top:20px; margin-bottom:20px; position:relative; display:none'>
          <div style='position:absolute; top: 10px; right: 10px; ; cursor: pointer'  onclick='expandCollapseSpacingOptions()'>[Hide]</div>
          <div style='margin:20px'>
              <label>Horizontal Spacing</label>
              <input id='inputHorizontalSpacing' type='text'>

              <label>Vertical Spacing</label>
              <input id='inputVerticalSpacing' type='text'>
          </div>
        </div>


        <!-- Printing Progress -->
        <div id='printProgressObj' style='background-color: #DADADA; border:thin solid #DADADA;margin:20px; position:fixed; top: 40%; left: 100px; right: 100px; margin: auto; display:none'>
            <div style='margin:20px'>
                <div style='font-size: 1.2em;'> PDF Generation In Progress</div>
                <div id='progressText'> </div>
                </div>
        </div>

        <!-- Row: Bottom Buttons -->
        <div class='row-New' style='width:100%'>
          <div class='col-md-12-New'>
              <div style='width:100%;height:10px'></div>
              <button class='btn-New btn-success-New' style='margin-left: 15px; float:right' onclick='generatePdf()'>Generate PDF</button>
              <div style='float:right; text-decoration:underline; font-style:italic; cursor: pointer' onclick='expandCollapseSpacingOptions()'>Spacing Options... </div>
          </div>
        </div>


        <div style='color: red; font-style:italic'>For issues or requests, please post in the forums.</div>

    </div>";
}

?>
