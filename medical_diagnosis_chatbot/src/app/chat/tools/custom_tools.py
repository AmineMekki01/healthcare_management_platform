"""
This module contains custom tools for performing significance testing and correlation analysis.
"""

from typing import Optional, Union

import numpy as np
from langchain.tools import BaseTool
from scipy.stats import ttest_ind
from src.app.chat.utils import load_config, preprocess_data

TOOL_CONSTANTS = load_config("config/tool_constants.yaml")

class SignificanceTesting(BaseTool):
    """Tool for significance Testing."""

    name = "significance_testing_tool"
    description = TOOL_CONSTANTS["significance_testing_desc"]

    def __init__(self):
        """Using base class initialization."""
        super().__init__()

    def calculate_significance(
        self,
        x: Optional[list] = None,
        y: Optional[list] = None,
    ) -> dict:
        """Calculate significance testing for 2 arrays.

        Args:
            x: List of values for the first column.
            y: List of values for the second column.

        Returns:
            A dictionary containing the t-statistic and p-value for the significance test.

        """
        array1 = np.array(x)
        array2 = np.array(y)

        t_stat, p_value = ttest_ind(array1, array2)

        return {"t_statistic": t_stat, "p_value": p_value}

    def _run(
        self,
        data: Union[dict, list, tuple, str],
    ) -> dict:
        """Synchronously Find Significance b/w 2 columns.

        Args:
            data: The input data in dictionary, list, tuple, or string format.

        Returns:
            A dictionary containing the t-statistic and p-value for the significance test.
        """
        df = preprocess_data(data)
        if df.shape[1] < 2:
            return "Not able to generate Pandas DataFrame to calculate significance testing."
        else:
            column_x = df.columns[0]
            column_y = df.columns[1]
            return self.calculate_significance(
                df[column_x].tolist(), df[column_y].tolist()
            )


class CorrelationTool(BaseTool):
    """Tool for performing correlation analysis."""

    name = "correlation_calculator"
    description = TOOL_CONSTANTS["correlation_desc"]

    def _run(
        self,
        data: Union[dict, list, tuple, str],
    ):
        """Synchronously Find Correlation b/w 2 columns.

        Args:
            data: The input data in dictionary, list, tuple, or string format.

        Returns:
            A dictionary containing the correlation coefficient.
        """
        df = preprocess_data(data)

        if df.shape[1] < 2:
            return "Not Able to Generate Pandas dataframe for correlation"
        else:
            corr_df = df.corr()
            corr = corr_df.iloc[0, 1]
            return corr