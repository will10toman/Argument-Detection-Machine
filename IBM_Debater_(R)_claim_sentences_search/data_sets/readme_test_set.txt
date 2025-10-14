NAME: IBM Debater(R) - Argument Search Engine Dataset

VERSION: v1

RELEASE DATE: June 11, 2018

DATASET OVERVIEW

2500 labeled sentences for 50 topics. The dataset contains the DNN score of each sentence, as well as its gold label as obtained 
by crowd labeling.

The dataset includes: 
1. A single CSV file, containing the top 50 sentences ranked by the DNN, on each of the 50 test-set topics, with their scores and labels.

The datasets are released under the following licensing and copyright terms:
• (c) Copyright Wikipedia (https://en.wikipedia.org/wiki/Wikipedia:Copyrights#Reusers.27_rights_and_obligations)
• (c) Copyright <anonymized> Released under CC-BY-SA (http://creativecommons.org/licenses/by-sa/3.0/)

CONTENTS

The CSV file test_set.csv includes the following columns for each sentence:
1. id - the topic id, as specified in the appendix of the paper from note (1)
2. topic - the motion topic
3. mc - the main Wikipedia concept of the topic
4. sentence
5. query_pattern - the query pattern that matches the sentence
6. score - the DNN score on the sentence, between 0 and 1
7. label - the gold label of the sentence, 1 for positive and 0 for negative
8. url - link to source Wikipedia article

NOTES:
(1) Please cite: 

    Towards an argumentative content search engine using weak supervision
    Ran Levy, Ben Bogin, Shai Gretz, Ranit Aharonov and Noam Slonim
    COLING 2018

(2) The list of topics in this dataset is the test set described in the appendix of the paper from note (1). The list of topics was taken from:

    Unsupervised corpus--wide claim detection
    Ran Levy, Shai Gretz, Benjamin Sznajder, Shay Hummel, Ranit Aharonov and Noam Slonim
    4th Workshop on Argument Mining, EMNLP, 2017
