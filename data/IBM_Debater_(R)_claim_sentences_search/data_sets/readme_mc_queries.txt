NAME: IBM Debater(R) - Argument Search Engine Dataset

VERSION: v1

RELEASE DATE: June 11, 2018

DATASET OVERVIEW

1.49M sentences for 150 topics, split into train, heldout and test sets.

The dataset includes: 
1. Three CSV files, for the train, heldout, and test sets, each containing all sentences retrieved by the MC query.

The datasets are released under the following licensing and copyright terms:
• (c) Copyright Wikipedia (https://en.wikipedia.org/wiki/Wikipedia:Copyrights#Reusers.27_rights_and_obligations)
• (c) Copyright IBM 2014. Released under CC-BY-SA (http://creativecommons.org/licenses/by-sa/3.0/)

CONTENTS

The three CSV files, q_mc_train.csv, q_mc_heldout.csv and q_mc_test.csv, contain the following columns for each sentence:
1. id - the topic id, as specified in the appendix of the paper from note (1)
2. topic - the motion topic
3. mc - the main Wikipedia concept of the topic
4. sentence
5. suffix - the suffix of the sentence following the mention of the mc
6. prefix - the prefix of the sentence preceding the mention of the mc
7. url - link to source Wikipedia article

NOTES:
(1) Please cite: 

    Towards an argumentative content search engine using weak supervision
    Ran Levy, Ben Bogin, Shai Gretz, Ranit Aharonov and Noam Slonim
    COLING 2018

(2) The lists of topics in these datasets are described in the appendix of the paper from note (1). The list of topics was taken from:

    Unsupervised corpus--wide claim detection
    Ran Levy, Shai Gretz, Benjamin Sznajder, Shay Hummel, Ranit Aharonov and Noam Slonim
    4th Workshop on Argument Mining, EMNLP, 2017
